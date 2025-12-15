import styles from '../admin.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
    const events = await prisma.event.findMany({
        orderBy: { startDate: 'desc' },
        include: { _count: { select: { bookings: true } } }
    });

    return (
        <div>
            <div className={styles.header}>
                <h1>Event Management</h1>
                <Link href="/admin/events/new" className={styles.button}>+ New Event</Link>
            </div>

            <div className={styles.card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '10px' }}>Date</th>
                            <th style={{ padding: '10px' }}>Title</th>
                            <th style={{ padding: '10px' }}>Location</th>
                            <th style={{ padding: '10px' }}>Bookings</th>
                            <th style={{ padding: '10px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{new Date(event.startDate).toLocaleDateString()}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{event.title}</td>
                                <td style={{ padding: '10px' }}>{event.location}</td>
                                <td style={{ padding: '10px' }}>{event._count.bookings}</td>
                                <td style={{ padding: '10px' }}>
                                    <Link href={`/admin/events/${event.id}`} style={{ marginRight: '10px', color: '#3498db' }}>Edit Rules</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {events.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No events found.</p>}
            </div>
        </div>
    );
}
