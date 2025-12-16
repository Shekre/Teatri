import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Simple text-based ticket (will be replaced with PDF in production)
function generateTextTicket(event: any, order: any): string {
    const seatList = order.items.map((item: any =>
        `  • ${item.seatLabel} - ${item.priceALL / 100} ALL`
    ).join('\n');

    const ticket = `
═══════════════════════════════════════════════════
           TEATRI KOMBETAR I OPERAS DHE BALETIT
═══════════════════════════════════════════════════

${event.title}

Date: ${new Date(event.startDateTime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    })}

───────────────────────────────────────────────────
YOUR SEATS:
${seatList}

───────────────────────────────────────────────────
Total: ${order.totalAmountALL / 100} ALL

Order ID: ${order.id}
Customer: ${order.fullName}
Email: ${order.email}

───────────────────────────────────────────────────
Please present this ticket at the entrance.
Doors open 30 minutes before the show.

═══════════════════════════════════════════════════
    `;

    return ticket;
}

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

        const event = await prisma.event.findUnique({
            where: { id: order.eventId }
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        // Generate text ticket (TODO: Replace with PDF using pdf-lib or puppeteer)
        const ticketContent = generateTextTicket(event, order);

        return new NextResponse(ticketContent, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="tickets-${order.id}.txt"`
            }
        });

    } catch (error) {
        console.error('[Ticket Generation Error]', error);
        return NextResponse.json(
            { error: 'Failed to generate tickets' },
            { status: 500 }
        );
    }
}
