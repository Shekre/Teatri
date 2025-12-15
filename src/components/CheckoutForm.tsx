'use client';

import { useState } from 'react';
import { processPaymentAction } from '@/app/actions';
import styles from './CheckoutForm.module.css';

export default function CheckoutForm({ bookingIds, total }: { bookingIds: string[], total: number }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await processPaymentAction(bookingIds, email, name);

        setLoading(false);
        if (res.success) {
            setSuccess(true);
        } else {
            alert('Payment failed: ' + res.error);
        }
    };

    if (success) {
        return (
            <div className={styles.success}>
                <h2>Payment Successful!</h2>
                <p>Tickets have been sent to {email}.</p>
                <button onClick={() => window.location.href = '/'}>Return Home</button>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
                <label>Email Address</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                />
            </div>

            <div className={styles.field}>
                <label>Full Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                />
            </div>

            <div className={styles.paymentMock}>
                <p>Credit Card (Mock)</p>
                <div className={styles.cardInfo}>
                    <span>**** **** **** 4242</span>
                    <span>12/26</span>
                </div>
            </div>

            <button type="submit" className={styles.payBtn} disabled={loading}>
                {loading ? 'Processing...' : `Pay ${total} ALL`}
            </button>
        </form>
    );
}
