import { getEventById } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
        notFound();
    }

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.logo}>TKOB</div>
                <nav className={styles.nav}>
                    <Link href="/">Calendar</Link>
                    <Link href="/about">About</Link>
                </nav>
            </header>

            <div className={styles.hero} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url(${event.image || '/placeholder.jpg'})` }}>
                <div className={styles.heroContent}>
                    <span className={styles.badge}>Upcoming Performance</span>
                    <h1>{event.title}</h1>
                    <p className={styles.meta}>
                        {new Date(event.startDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {' • '}
                        {new Date(event.startDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {' • '}
                        {event.location}
                    </p>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.description}>
                        <h3>About the Event</h3>
                        <p>{event.description}</p>
                    </div>

                    <div className={styles.sidebar}>
                        <div className={styles.ticketBox}>
                            <p className={styles.priceLabel}>Tickets starting from</p>
                            <p className={styles.priceValue}>500 ALL</p>
                            <Link href={`/${id}/seatmap`} className={styles.buyButton}>
                                Select Seats
                            </Link>
                            <p className={styles.note}>10-minute hold on selected seats</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
