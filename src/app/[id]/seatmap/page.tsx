import { prisma } from '@/lib/prisma';

// Force dynamic because pricing/availability might change
export const dynamic = 'force-dynamic';

export default async function SeatMapPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
        return <div>Event not found</div>;
    }

    // Fetch all seats
    const seats = await prisma.seat.findMany();

    // Fetch SOLD/HELD tickets
    // In a real app we need to check availability status in DB (Booking table)
    // Our getSeatPrice logic calculates PRICE rules, but availability is dynamic.
    // We need to fetch tickets for this event.

    const tickets = await prisma.ticket.findMany({
        where: {
            booking: {
                eventId: id,
                status: { in: ['CONFIRMED', 'PENDING'] }
            }
        },
        include: {
            booking: true
        }
    });

    const ticketMap = new Map();
    tickets.forEach(t => {
        ticketMap.set(t.seatId, t.booking.status);
    });

    // Calculate state for each seat
    const seatStates = seats.map(seat => {
        // 1. Pricing Rules
        const pricing = getSeatPrice(seat, event.priceAreas);

        // 2. Override with Real Availability
        let finalStatus = pricing.status;
        const bookingStatus = ticketMap.get(seat.id); // CONFIRMED or PENDING

        if (bookingStatus === 'CONFIRMED') {
            finalStatus = 'SOLD';
        } else if (bookingStatus === 'PENDING') {
            finalStatus = 'HELD';
        }

        return {
            id: seat.id,
            x: seat.x || 0,
            y: seat.y || 0,
            row: seat.row,
            number: seat.number,
            section: seat.section,
            status: finalStatus,
            price: pricing.price,
            color: pricing.color
        };
    });

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Select Seats</h1>
                <p>{event.title}</p>
            </div>

            <div className={styles.container}>
                <SeatMap seats={seatStates} eventId={id} />
            </div>
        </main>
    );
}
