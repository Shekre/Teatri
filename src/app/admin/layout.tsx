import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>TKOB Admin</div>
                <nav className={styles.nav}>
                    <Link href="/admin">Dashboard</Link>
                    <Link href="/admin/events">Events</Link>
                    <Link href="/admin/bookings">Bookings</Link>
                    <Link href="/admin/settings">Settings</Link>
                    <Link href="/" className={styles.publicLink}>View Public Site</Link>
                </nav>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
