import Link from 'next/link';
import { getUpcomingEvents } from '@/lib/data';
import styles from './page.module.css';

// We'll create module css next
export default async function Home() {
  const events = await getUpcomingEvents();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>TKOB</div>
        <nav className={styles.nav}>
          <Link href="/">Calendar</Link>
          <Link href="/about">About</Link>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1>Teatri Kombëtar i Operas dhe Baletit</h1>
        <p>Experience the magic of performance.</p>
      </section>

      <section className={styles.calendar}>
        <h2>Upcoming Events</h2>
        <div className={styles.grid}>
          {events.length === 0 ? (
            <p>No upcoming events.</p>
          ) : (
            events.map((event) => (
              <Link href={`/${event.id}`} key={event.id} className={styles.card}>
                <div
                  className={styles.cardImage}
                  style={{ backgroundImage: `url(${event.image || '/placeholder.jpg'})` }}
                />
                <div className={styles.cardContent}>
                  <span className={styles.date}>
                    {new Date(event.startDate).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <h3>{event.title}</h3>
                  <p>{event.location}</p>
                  <span className={styles.cta}>Buy Tickets &rarr;</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
