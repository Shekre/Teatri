'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import styles from './page.module.css';

type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('t');

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pollCount, setPollCount] = useState(0);

    useEffect(() => {
        if (!orderId || !token) {
            setError('Missing order information');
            setLoading(false);
            return;
        }

        const pollOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}?t=${token}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch order');
                }

                setOrder(data);

                // Stop polling if order is no longer PENDING or after 30 polls (60 seconds)
                if (data.status !== 'PENDING' || pollCount >= 30) {
                    setLoading(false);
                } else {
                    setPollCount(c => c + 1);
                }

            } catch (err: any) {
                console.error('[Order Poll Error]', err);
                setError(err.message);
                setLoading(false);
            }
        };

        pollOrder();

        // Poll every 2 seconds if still pending
        let interval: NodeJS.Timeout | null = null;
        if (loading && order?.status === 'PENDING') {
            interval = setInterval(pollOrder, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [orderId, token, pollCount, loading, order?.status]);

    const handleResendEmail = async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}/resend-email?t=${token}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                alert('Email sent successfully!');
            } else {
                alert(data.error || 'Failed to send email');
            }
        } catch (err) {
            alert('Failed to resend email');
        }
    };

    if (error) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1>Error</h1>
                    <p>{error}</p>
                </div>
            </main>
        );
    }

    if (!order && loading) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1>Loading...</h1>
                    <p>Please wait while we confirm your payment...</p>
                </div>
            </main>
        );
    }

    if (order?.status === 'PENDING') {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1>Confirming Payment...</h1>
                    <p>We're waiting for payment confirmation from 2Checkout.</p>
                    <p>This usually takes a few seconds. Please don't close this page.</p>
                    <div className={styles.loading}>⏳</div>
                </div>
            </main>
        );
    }

    if (order?.status === 'FAILED' || order?.status === 'EXPIRED') {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1>Payment {order.status === 'FAILED' ? 'Failed' : 'Expired'}</h1>
                    <p>Your payment was not completed.</p>
                    <p>Please try again or contact support if you believe this is an error.</p>
                    <a href="/" className={styles.button}>Return to Home</a>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.success}>
                    <h1>✓ Payment Successful!</h1>
                    <p>Thank you for your purchase, {order.fullName}!</p>
                </div>

                <div className={styles.orderDetails}>
                    <h2>Order Details</h2>
                    <p><strong>Order ID:</strong> {order.id}</p>
                    <p><strong>Event:</strong> {order.event?.title}</p>
                    <p><strong>Date:</strong> {new Date(order.event?.startDate).toLocaleString()}</p>

                    <h3>Your Seats:</h3>
                    <ul>
                        {order.items.map((item: any, idx: number) => (
                            <li key={idx}>
                                {item.seatLabel} - {item.priceALL / 100} ALL
                            </li>
                        ))}
                    </ul>

                    <p className={styles.total}>
                        <strong>Total:</strong> {order.totalAmountALL / 100} ALL
                    </p>
                </div>

                <div className={styles.downloads}>
                    <h2>Download Your Tickets</h2>
                    <p>An email has been sent to <strong>{order.email}</strong> with your tickets.</p>

                    <div className={styles.buttons}>
                        <a
                            href={order.downloads.tickets}
                            className={styles.button}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            📄 Download Tickets
                        </a>

                        <a
                            href={order.downloads.calendar}
                            className={styles.button}
                            download
                        >
                            📅 Add to Calendar
                        </a>

                        <button
                            onClick={handleResendEmail}
                            className={styles.buttonSecondary}
                        >
                            📧 Resend Email
                        </button>
                    </div>
                </div>

                <div className={styles.info}>
                    <p>Please present your tickets at the venue entrance.</p>
                    <p>Doors open 30 minutes before the show.</p>
                </div>
            </div>
        </main>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
