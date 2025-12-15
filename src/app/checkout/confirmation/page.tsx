import Link from 'next/link';
import styles from './page.module.css';

export default function ConfirmationPage() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Order Confirmed!</h1>
                <p>Your tickets have been sent to your email.</p>
                <div className={styles.actions}>
                    <Link href="/" className={styles.button}>Back to Calendar</Link>
                </div>
            </div>
        </div>
    );
}
