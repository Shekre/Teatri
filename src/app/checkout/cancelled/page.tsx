'use client';

import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

import { Suspense } from 'react';

function CancelledContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1>Payment Cancelled</h1>

                <p>Your payment was cancelled and has not been processed.</p>

                <div className={styles.info}>
                    {orderId && (
                        <p>
                            <strong>Order ID:</strong> {orderId}
                        </p>
                    )}

                    <p>
                        Your selected seats are held for 10 minutes from when you started checkout.
                    </p>

                    <p>
                        You can try again by returning to the seat selection page,
                        or the seats will automatically be released after 10 minutes.
                    </p>
                </div>

                <div className={styles.actions}>
                    <Link href="/" className={styles.button}>
                        Return to Home
                    </Link>

                    <Link href="/events" className={styles.buttonSecondary}>
                        Browse Events
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function CancelledPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CancelledContent />
        </Suspense>
    );
}
