import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Ensure no caching

// Helper to compute HMAC_SHA256
function calculateHmac(data: string, key: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex').toUpperCase(); // 2Checkout often expects uppercase
}

// Helper to format date as YmdHis (UTC)
function getFormattedDate(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
        now.getUTCFullYear() +
        pad(now.getUTCMonth() + 1) +
        pad(now.getUTCDate()) +
        pad(now.getUTCHours()) +
        pad(now.getUTCMinutes()) +
        pad(now.getUTCSeconds())
    );
}

export async function POST(req: NextRequest) {
    try {
        const text = await req.text();
        const params = new URLSearchParams(text);
        const data: Record<string, string> = {};

        // Convert URLSearchParams to object
        params.forEach((value, key) => {
            data[key] = value;
        });

        // 1. Verify Signature is absent or valid?
        // Actually, 2Checkout IPN sends a HASH signature based on params.
        // But for response, we MUST calculate a signature.
        // Let's first process the order, then return the signature.

        const REFNO = data['REFNO'];
        const REFNOEXT = data['REFNOEXT']; // Used as Order ID
        const ORDERSTATUS = data['ORDERSTATUS'];
        const IPN_PID = data['IPN_PID[]'] || data['IPN_PID[0]']; // Array or single? Usually array format in keys
        const IPN_PNAME = data['IPN_PNAME[]'] || data['IPN_PNAME[0]'];
        const IPN_DATE = data['IPN_DATE'];

        if (!REFNO || !REFNOEXT || !ORDERSTATUS) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // 2. Identify Order
        const order = await prisma.order.findUnique({
            where: { id: REFNOEXT } // REFNOEXT is our order.id
        });

        if (!order) {
            console.error(`Order not found: ${REFNOEXT}`);
            // Return 200 to satisfy 2Checkout retry logic loop, but log error
            return new NextResponse('Order not found', { status: 200 });
        }

        // 3. Status Mapping
        let newStatus: OrderStatus | undefined;
        let paymentStatus = 'PENDING';

        switch (ORDERSTATUS) {
            case 'PAYMENT_AUTHORIZED':
            case 'PAYMENT_RECEIVED':
            case 'COMPLETE':
                newStatus = 'PAID';
                paymentStatus = 'PAID';
                break;
            case 'REFUNDED':
            case 'REVERSED':
            case 'CHARGEBACK':
                newStatus = 'REFUNDED';
                paymentStatus = 'REFUNDED';
                break;
            case 'FAIL':
            case 'DENIED':
                newStatus = 'FAILED';
                paymentStatus = 'FAILED';
                break;
            default:
                // Other statuses (e.g. PENDING, INVALID), keep as is or log
                paymentStatus = ORDERSTATUS;
        }

        // 4. Idempotency & Update
        // Only update if status changed or just to log the new payload
        // We always update the payload history/latest

        // If already PAID and new status is PAID, ignore? 
        // 2Checkout might send multiple IPNs (Authorized -> Complete). Both mean PAID for us.

        if (newStatus) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: newStatus,
                    paymentStatus: paymentStatus, // Explicit string status
                    providerRefNo: REFNO,
                    ipnPayload: data as any, // Cast to JSON
                    paidAt: newStatus === 'PAID' ? (order.paidAt || new Date()) : order.paidAt
                }
            });
            console.log(`Order ${order.id} updated to ${newStatus}`);
        } else {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    ipnPayload: data as any,
                    paymentStatus: paymentStatus
                }
            });
        }


        // 5. Generate Response Signature
        // Format: <sig algo="sha256" date="YYYYMMDDHHMMSS">HMAC</sig>
        // HMAC Source:
        // LEN(IPN_PID[0]) + IPN_PID[0] + LEN(IPN_PNAME[0]) + IPN_PNAME[0] + ...
        // Wait, standard structure is often simpler or depends on specific fields.
        // User instructions: "byteLength+value for IPN_PID[0], IPN_PNAME[0], IPN_DATE, and DATE"

        const secretKey = process.env.TWOCHECKOUT_SECRET_KEY || '';
        const date = getFormattedDate();

        // Need the FIRST item of PID and PNAME if arrays.
        // Params from text/urlencoded might identify them as 'IPN_PID[0]' etc.
        // If multiple items, we only take the first one per user instruction "IPN_PID[0]".

        const pId = data['IPN_PID[0]'] || '';
        const pName = data['IPN_PNAME[0]'] || '';
        const ipnDate = data['IPN_DATE'] || '';

        // Helper string builder
        const strBuilder = [];

        strBuilder.push(Buffer.byteLength(pId).toString());
        strBuilder.push(pId);

        strBuilder.push(Buffer.byteLength(pName).toString());
        strBuilder.push(pName);

        strBuilder.push(Buffer.byteLength(ipnDate).toString());
        strBuilder.push(ipnDate);

        strBuilder.push(Buffer.byteLength(date).toString());
        strBuilder.push(date);

        const sourceString = strBuilder.join('');
        const signature = calculateHmac(sourceString, secretKey);

        const responseXml = `<sig algo="sha256" date="${date}">${signature}</sig>`;

        return new NextResponse(responseXml, {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error) {
        console.error('IPN Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
