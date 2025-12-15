import { prisma } from '@/lib/prisma';
import { getEventById } from '@/lib/data';
import PublicSeatSelector from '@/components/PublicSeatSelector';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function SeatMapPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
        return <div>Event not found</div>;
    }

    // Fetch tickets for this event to check availability
    const tickets = await prisma.ticket.findMany({
        where: {
            booking: {
                eventId: id,
                status: { in: ['CONFIRMED', 'PENDING'] }
            }
        },
        include: {
            booking: true,
            seat: true
        }
    });

    // Build a map of seat availability
    // We need to map seat identifiers (row-number format) to their status
    const seatStatusMap = new Map();

    // First, determine pricing for all possible seats based on price areas
    event.priceAreas.forEach((priceArea: any) => {
        try {
            const selectors = JSON.parse(priceArea.selectors);

            if (selectors.seats) {
                // Admin-created rules store seat IDs directly
                selectors.seats.forEach((seatId: string) => {
                    seatStatusMap.set(seatId, {
                        id: seatId,
                        status: priceArea.saleStatus as any,
                        price: priceArea.price,
                        color: priceArea.color || '#444'
                    });
                });
            }
        } catch (e) {
            console.error('Failed to parse selectors', e);
        }
    });

    // Override with sold/held tickets
    tickets.forEach((ticket: any) => {
        const seat = ticket.seat;
        // Build seat ID from seat data
        const seatId = seat.row ? `${seat.row}-${seat.number}` : `${seat.section}-${seat.number}`;

        seatStatusMap.set(seatId, {
            id: seatId,
            status: ticket.booking.status === 'CONFIRMED' ? 'SOLD' : 'HELD',
            price: ticket.priceAtBooking,
            color: '#000'
        });
    });

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Select Seats</h1>
                <p>{event.title}</p>
            </div>

            <div className={styles.container}>
                <PublicSeatSelector seatStatusMap={seatStatusMap} eventId={id} />
            </div>
        </main>
    );
}
