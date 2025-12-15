import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const auth = cookieStore.get('auth');

    if (!auth) {
        redirect('/login');
    }

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
