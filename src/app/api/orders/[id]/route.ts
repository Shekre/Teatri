import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
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

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true
            }
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

        // Get event details
        const event = await prisma.event.findUnique({
            where: { id: order.eventId }
        });

        // Return sanitized data
        return NextResponse.json({
            id: order.id,
            status: order.status,
            email: order.email,
            fullName: order.fullName,
            phone: order.phone,
            totalAmountALL: order.totalAmountALL,
            currency: order.currency,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            event: event ? {
                id: event.id,
                title: event.title,
                startDateTime: event.startDateTime
            } : null,
            items: order.items.map(item => ({
                seatLabel: item.seatLabel,
                priceALL: item.priceALL
            })),
            downloads: {
                tickets: order.ticketUrl || `/api/orders/${order.id}/tickets?t=${token}`,
                invoice: order.invoiceUrl || `/api/orders/${order.id}/invoice?t=${token}`,
                calendar: order.icsUrl || `/api/orders/${order.id}/calendar?t=${token}`
            }
        });

    } catch (error) {
        console.error('[Order Get Error]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
