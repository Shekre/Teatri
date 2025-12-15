import styles from './admin.module.css';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function AdminDashboard() {
    const eventCount = await prisma.event.count();
    const bookingCount = await prisma.booking.count();
    const revenue = await prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalAmount: true }
    });

    return (
        <div>
            <div className={styles.header}>
                <h1>Dashboard</h1>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{eventCount}</span>
                        <span className={styles.statLabel}>Total Events</span>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{bookingCount}</span>
                        <span className={styles.statLabel}>Total Bookings</span>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{(revenue._sum.totalAmount || 0).toLocaleString()}</span>
                        <span className={styles.statLabel}>Revenue (ALL)</span>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <h2>Recent Activity</h2>
                <p>No recent activity.</p>
            </div>
        </div>
    );
}
