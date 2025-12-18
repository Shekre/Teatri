'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import styles from './page.module.css';
import { initiateCheckoutAction } from '../actions';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const seatIds = searchParams.get('seats')?.split(',') || [];
    const eventId = searchParams.get('eventId') || '';

    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!eventId || seatIds.length === 0) {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.heading}>No Seats Selected</h1>
                    <p style={{ color: '#888', textAlign: 'center' }}>Please select seats from the seat map.</p>
                </div>
            </main>
        );
    }

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await initiateCheckoutAction(eventId, seatIds, email, fullName, phone);

            if (!result.success || !result.redirectUrl) {
                throw new Error(result.error || 'Failed to initiate payment');
            }

            // Redirect to 2Checkout
            window.location.href = result.redirectUrl;

        } catch (err: any) {
            console.error('[Checkout Error]', err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1 className={styles.heading}>Checkout</h1>

                <div className={styles.summary}>
                    <h2>Order Summary</h2>
                    <p><strong>Selected Seats:</strong> {seatIds.length}</p>
                    <ul>
                        {seatIds.map(seatId => (
                            <li key={seatId}>{seatId}</li>
                        ))}
                    </ul>
                    <p className={styles.note}>
                        Price will be calculated based on your seat selection.
                    </p>
                </div>

                <form onSubmit={handleCheckout} className={styles.form}>
                    <h2 className={styles.sectionTitle}>Your Information</h2>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.field}>
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="fullName">Full Name *</label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="phone">Phone (Optional)</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+355 XX XXX XXXX"
                        />
                    </div>

                    <div className={styles.paymentInfo}>
                        <p>
                            <strong>Payment Method:</strong> Secure payment via 2Checkout
                        </p>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>You will be redirected to complete your payment securely.</p>
                        <p style={{ color: '#d4af37', marginTop: '0.5rem' }}>Currency: ALL</p>
                    </div>

                    <button
                        type="submit"
                        className={styles.payButton}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Proceed to Payment'}
                    </button>

                    <p className={styles.notice}>
                        Your seats will be held for 10 minutes while you complete payment.
                    </p>
                </form>
            </div>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
