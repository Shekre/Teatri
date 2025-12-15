'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { holdSeatsAction } from '@/app/actions'; // Server Action
import styles from './SeatMap.module.css';

export type SeatState = {
    id: string;
    x: number;
    y: number;
    row: string | null;
    number: string;
    section: string;
    status: 'FOR_SALE' | 'NOT_FOR_SALE' | 'ADMIN_RESERVED' | 'SOLD' | 'HELD';
    price: number | null;
    color?: string; // Color code from PriceArea
};

type Props = {
    seats: SeatState[];
    eventId: string;
};

export default function SeatMap({ seats, eventId }: Props) {
    const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
    const [hoveredSeat, setHoveredSeat] = useState<SeatState | null>(null);
    const router = useRouter();

    const handleSeatClick = (seat: SeatState) => {
        if (seat.status !== 'FOR_SALE') return;

        setSelectedSeatIds((prev) => {
            if (prev.includes(seat.id)) {
                return prev.filter(id => id !== seat.id);
            } else {
                if (prev.length >= 6) return prev;
                return [...prev, seat.id];
            }
        });
    };

    const handleCheckout = async () => {
        if (selectedSeatIds.length === 0) return;

        // Call Server Action
        const result = await holdSeatsAction(eventId, selectedSeatIds);

        if (result.success && result.bookingIds) {
            router.push(`/checkout?ids=${result.bookingIds.join(',')}`);
        } else {
            alert('Failed to hold seats: ' + result.error);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.stage}>STAGE</div>

            <div className={styles.mapContainer}>
                {seats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isAvailable = seat.status === 'FOR_SALE';

                    let backgroundColor = isSelected ? '#fff' : (seat.color || '#444');
                    if (!isAvailable) backgroundColor = '#222';
                    if (seat.status === 'SOLD' || seat.status === 'HELD') backgroundColor = '#000';

                    return (
                        <div
                            key={seat.id}
                            className={styles.seat}
                            style={{
                                left: `${seat.x}px`,
                                top: `${seat.y}px`,
                                backgroundColor,
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                opacity: isAvailable ? 1 : 0.5,
                            }}
                            onClick={() => handleSeatClick(seat)}
                            onMouseEnter={() => setHoveredSeat(seat)}
                            onMouseLeave={() => setHoveredSeat(null)}
                        />
                    );
                })}
            </div>

            <div className={styles.footer}>
                <div className={styles.selectionSummary}>
                    <p>{selectedSeatIds.length} seats selected</p>
                    <p className={styles.totalPrice}>
                        {selectedSeatIds.reduce((sum, id) => {
                            const s = seats.find(x => x.id === id);
                            return sum + (s?.price || 0);
                        }, 0)} ALL
                    </p>
                </div>
                <button
                    className={styles.checkoutBtn}
                    disabled={selectedSeatIds.length === 0}
                    onClick={handleCheckout}
                >
                    Proceed to Checkout
                </button>
            </div>

            {hoveredSeat && (
                <div className={styles.tooltip}>
                    <p>{hoveredSeat.section}</p>
                    <p>Row {hoveredSeat.row} - Seat {hoveredSeat.number}</p>
                    <p className={styles.tooltipPrice}>
                        {hoveredSeat.status === 'FOR_SALE' ? `${hoveredSeat.price} ALL` : hoveredSeat.status}
                    </p>
                </div>
            )}
        </div>
    );
}
