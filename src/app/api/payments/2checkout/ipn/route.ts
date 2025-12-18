import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Verify 2Checkout IPN signature
function verify2CheckoutIPN(params: Record<string, string>, secretKey: string): boolean {
    // 2Checkout IPN verification for hosted checkout
    // Extract hash from params
    const receivedHash = params.key || params.hash;

    if (!receivedHash) {
        console.error('[2Checkout IPN] No hash provided');
        return false;
    }

    // Build string to hash according to 2Checkout documentation
    // For hosted checkout: concatenate specific parameters + secret
    const stringToHash = Object.keys(params)
        .filter(key => key !== 'key' && key !== 'hash')
        .sort()
        .map(key => `${key}${params[key]}`)
        .join('') + secretKey;

    const calculatedHash = crypto
        .createHash('md5')
        .update(stringToHash)
        .digest('hex')
        .toUpperCase();

    const isValid = calculatedHash === receivedHash.toUpperCase();

    if (!isValid) {
        console.error('[2Checkout IPN] Hash mismatch', {
            received: receivedHash,
            calculated: calculatedHash
        });
    }

    return isValid;
}

// Send email with tickets via Resend
async function sendTicketEmail(order: any, event: any) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'tickets@teatri.al';

    if (!RESEND_API_KEY) {
        console.error('[Email] RESEND_API_KEY not configured');
        throw new Error('Email service not configured');
    }

    try {
        const seatList = order.items.map((item: any) =>
            `${item.seatLabel} - ${item.priceALL / 100} ALL`
        ).join('\n');

        const emailHtml = `
            <h1>Your Tickets for ${event.title}</h1>
            <p>Thank you for your order!</p>
            
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Event:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short'
        })}</p>
            
            <h3>Your Seats:</h3>
            <pre>${seatList}</pre>
            
            <p><strong>Total:</strong> ${order.totalAmountALL / 100} ALL</p>
            
            <h3>Download Your Tickets</h3>
            <p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/${order.id}/tickets?t=${order.publicToken}">
                    Download Tickets PDF
                </a>
            </p>
            <p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/${order.id}/calendar?t=${order.publicToken}">
                    Add to Calendar
                </a>
            </p>
            
            <p>See you at the theatre!</p>
        `;

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: EMAIL_FROM,
                to: order.email,
                subject: `Your Tickets – ${event.title}`,
                html: emailHtml
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Resend API error: ${error}`);
        }

        const result = await response.json();
        console.log('[Email Sent]', { orderId: order.id, emailId: result.id });

        return result;
    } catch (error) {
        console.error('[Email Error]', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type');
        let params: Record<string, string> = {};

        // Parse IPN data based on content type
        if (contentType?.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            formData.forEach((value, key) => {
                params[key] = value.toString();
            });
        } else {
            params = await request.json();
        }

        console.log('[2Checkout IPN] Received', {
            messageType: params.message_type,
            orderId: params.merchant_order_id
        });

        // Verify signature
        const SECRET_KEY = process.env.TWOCHECKOUT_SECRET_KEY;
        if (!SECRET_KEY) {
            console.error('[2Checkout IPN] SECRET_KEY not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const isValid = verify2CheckoutIPN(params, SECRET_KEY);
        if (!isValid) {
            console.error('[2Checkout IPN] Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Extract order ID
        const orderId = params.merchant_order_id || params.vendor_order_id;
        if (!orderId) {
            console.error('[2Checkout IPN] No order ID in IPN');
            return NextResponse.json({ error: 'No order ID' }, { status: 400 });
        }

        // Load order with items and event
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                locks: true
            }
        });

        if (!order) {
            console.error('[2Check out IPN] Order not found', orderId);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Idempotency check
        if (order.status === 'PAID') {
            console.log('[2Checkout IPN] Order already paid', orderId);
            return NextResponse.json({ status: 'already_processed' });
        }

        // Get event details
        const event = await prisma.event.findUnique({
            where: { id: order.eventId }
        });

        if (!event) {
            console.error('[2Checkout IPN] Event not found', order.eventId);
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Handle payment status
        const messageType = params.message_type || params.MESSAGE_TYPE;
        const paymentStatus = params.invoice_status || params.PAYMENT_METHOD;

        if (messageType === 'ORDER_CREATED' || paymentStatus === 'approved' || paymentStatus === 'deposited') {
            console.log('[2Checkout IPN] Payment successful', orderId);

            // Update order and locks in transaction
            await prisma.$transaction(async (tx) => {
                // Update order
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                        paymentRef: params.sale_id || params.order_number || params.invoice_id
                    }
                });

                // Convert locks to SOLD
                await tx.seatLock.updateMany({
                    where: { orderId },
                    data: { status: 'SOLD' }
                });
            });

            // Send email
            try {
                await sendTicketEmail(order, event);

                await prisma.order.update({
                    where: { id: orderId },
                    data: { emailSentAt: new Date() }
                });
            } catch (emailError: any) {
                console.error('[Email Error]', emailError);

                await prisma.order.update({
                    where: { id: orderId },
                    data: { lastEmailError: emailError.message }
                });
            }

            console.log('[Order Completed]', orderId);

        } else if (messageType === 'REFUND_ISSUED' || paymentStatus === 'declined') {
            console.log('[2Checkout IPN] Payment failed/refunded', orderId);

            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'FAILED' }
            });
        }

        return NextResponse.json({ status: 'processed' });

    } catch (error: any) {
        console.error('[2Checkout IPN Error]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
