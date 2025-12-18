import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Rate limiting storage (in production, use Redis or similar)
const emailRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(orderId: string): boolean {
    const now = Date.now();
    const limit = emailRateLimit.get(orderId);

    if (!limit || now > limit.resetAt) {
        // Reset or create new limit
        emailRateLimit.set(orderId, {
            count: 1,
            resetAt: now + 3600000 // 1 hour from now
        });
        return true;
    }

    if (limit.count >= 3) {
        return false; // Exceeded limit
    }

    limit.count++;
    return true;
}

async function sendTicketEmail(order: any, event: any) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'tickets@teatri.al';

    if (!RESEND_API_KEY) {
        throw new Error('Email service not configured');
    }

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

    return await response.json();
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('t');

        if (!token) {
            return NextResponse.json(
                { error: 'Token required' },
                { status: 401 }
            );
        }

        // Check rate limit
        if (!checkRateLimit(id)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Maximum 3 emails per hour.' },
                { status: 429 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (order.publicToken !== token) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 403 }
            );
        }

        if (order.status !== 'PAID') {
            return NextResponse.json(
                { error: 'Order not paid yet' },
                { status: 400 }
            );
        }

        // Get event
        const event = await prisma.event.findUnique({
            where: { id: order.eventId }
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        // Send email
        try {
            await sendTicketEmail(order, event);

            await prisma.order.update({
                where: { id },
                data: {
                    emailSentAt: new Date(),
                    lastEmailError: null
                }
            });

            return NextResponse.json({ success: true });

        } catch (emailError: any) {
            console.error('[Resend Email Error]', emailError);

            await prisma.order.update({
                where: { id },
                data: { lastEmailError: emailError.message }
            });

            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('[Resend Email Route Error]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
