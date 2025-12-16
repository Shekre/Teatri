import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Generate .ics calendar file
function generateICS(event: any, order: any): string {
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const seatList = order.items.map((item: any) => item.seatLabel).join(', ');

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Teatri Kombetar//Ticket System//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:order-${order.id}@teatri.al
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
LOCATION:Teatri Kombetar i Operas dhe Baletit
DESCRIPTION:Order: ${order.id}\\nSeats: ${seatList}\\nTotal: ${order.totalAmountALL / 100} ALL
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P1D
DESCRIPTION:Reminder: ${event.title} tomorrow
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return ics;
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

        const icsContent = generateICS(event, order);

        return new NextResponse(icsContent, {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="event-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics"`
            }
        });

    } catch (error) {
        console.error('[Calendar Generation Error]', error);
        return NextResponse.json(
            { error: 'Failed to generate calendar file' },
            { status: 500 }
        );
    }
}
