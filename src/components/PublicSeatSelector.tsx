'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { holdSeatsAction } from '@/app/actions';
import styles from './PublicSeatSelector.module.css';

// Same layouts as admin
const PLATEA_LAYOUT = {
    rows: ['R', 'Q', 'P', 'N', 'M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],
    seatsPerRow: {
        'R': 32, 'Q': 32, 'P': 32, 'N': 32, 'M': 32, 'L': 32, 'K': 32, 'J': 32,
        'H': 32, 'G': 32, 'F': 32, 'E': 32, 'D': 32, 'C': 32, 'B': 30, 'A': 28
    }
};

const LLOZHA1_BOXES = {
    left: [
        { name: '17', seats: 3, section: 'Llozha Djathtas' },
        { name: '18', seats: 3, section: 'Llozha Djathtas' },
        { name: '19', seats: 3, section: 'Llozha Djathtas' },
        { name: '20', seats: 3, section: 'Llozha Djathtas' },
        { name: '21', seats: 3, section: 'Llozha Djathtas' },
        { name: '22', seats: 3, section: 'Llozha Djathtas' },
        { name: '23', seats: 2, section: 'Llozha Djathtas' },
        { name: '24', seats: 2, section: 'Llozha Djathtas' },
    ],
    right: [
        { name: '24', seats: 2, section: 'Llozha Majtas' },
        { name: '23', seats: 2, section: 'Llozha Majtas' },
        { name: '22', seats: 3, section: 'Llozha Majtas' },
        { name: '21', seats: 3, section: 'Llozha Majtas' },
        { name: '20', seats: 3, section: 'Llozha Majtas' },
        { name: '19', seats: 3, section: 'Llozha Majtas' },
        { name: '18', seats: 3, section: 'Llozha Majtas' },
        { name: '17', seats: 3, section: 'Llozha Majtas' },
    ],
    sideLeft: ['8', '7', '6', '5', '4', '3', '2', '1'],
    sideRight: ['1', '2', '3', '4', '5', '6', '7', '8']
};

const LLOZHA2_LAYOUT = {
    rows: ['Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S'],
    seatsPerRow: {
        'Z': { ranges: [{ start: 1, end: 6 }, { start: 20, end: 25 }] },
        'Y': { ranges: [{ start: 1, end: 6 }, { start: 20, end: 25 }] },
        'X': { ranges: [{ start: 7, end: 19 }] },
        'W': { count: 33 },
        'V': { count: 33 },
        'U': { count: 33 },
        'T': { count: 33 },
        'S': { count: 31 }
    },
    sideLeft: ['47', '46', '45', '44', '43', '42', '41', '40'],
    sideRight: ['57', '56', '55', '54', '53', '52', '51', '50']
};

export type SeatState = {
    id: string;
    status: 'FOR_SALE' | 'NOT_FOR_SALE' | 'ADMIN_RESERVED' | 'SOLD' | 'HELD';
    price: number | null;
    color?: string;
};

type Props = {
    seatStatusMap: Map<string, SeatState>; // Map seatId to status/price
    eventId: string;
};

export default function PublicSeatSelector({ seatStatusMap, eventId }: Props) {
    const [activeFloor, setActiveFloor] = useState<'platea' | 'llozha1' | 'llozha2'>('platea');
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
    const router = useRouter();

    const toggleSeat = (seatId: string) => {
        const seatState = seatStatusMap.get(seatId);
        if (!seatState || seatState.status !== 'FOR_SALE') return;

        const newSelection = new Set(selectedSeats);
        if (newSelection.has(seatId)) {
            newSelection.delete(seatId);
        } else {
            if (newSelection.size >= 6) {
                alert('Maximum 6 seats per booking');
                return;
            }
            newSelection.add(seatId);
        }
        setSelectedSeats(newSelection);
    };

    const handleCheckout = () => {
        if (selectedSeats.size === 0) return;

        // Redirect to new checkout page with seat IDs and event ID
        const seats = Array.from(selectedSeats).join(',');
        router.push(`/checkout?seats=${seats}&eventId=${eventId}`);
    };

    const renderPlatea = () => (
        <div className={styles.seatGrid}>
            {PLATEA_LAYOUT.rows.map(row => {
                const seatCount = PLATEA_LAYOUT.seatsPerRow[row as keyof typeof PLATEA_LAYOUT.seatsPerRow];
                return (
                    <div key={row} className={styles.row}>
                        <span className={styles.rowLabel}>{row}</span>
                        {Array.from({ length: seatCount }).map((_, i) => {
                            const seatNum = i + 1;
                            const seatId = `${row}-${seatNum}`;
                            const seatState = seatStatusMap.get(seatId);
                            const isAvailable = seatState?.status === 'FOR_SALE';
                            const isSelected = selectedSeats.has(seatId);

                            return (
                                <button
                                    key={seatId}
                                    className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                    onClick={() => toggleSeat(seatId)}
                                    disabled={!isAvailable}
                                    title={isAvailable ? `${seatId} - ${seatState?.price} ALL` : `${seatId} (${seatState?.status})`}
                                    style={{ backgroundColor: isSelected ? 'var(--gold)' : (seatState?.color || '#444') }}
                                >
                                    {seatNum}
                                </button>
                            );
                        })}
                        <span className={styles.rowLabel}>{row}</span>
                    </div>
                );
            })}
            <div className={styles.stage}>SKENA</div>
        </div>
    );

    const renderLlozha1 = () => (
        <div className={styles.llozhaContainer}>
            <div className={styles.llozhaBoxes}>
                <div className={styles.boxColumn}>
                    <h4>Llozha Djathtas</h4>
                    {LLOZHA1_BOXES.left.map((box) => (
                        <div key={`left-${box.name}`} className={styles.box}>
                            <span className={styles.boxName}>{box.name}</span>
                            <div className={styles.boxSeats}>
                                {Array.from({ length: box.seats }).map((_, s) => {
                                    const seatId = `${box.section}-${box.name}-${s + 1}`;
                                    const seatState = seatStatusMap.get(seatId);
                                    const isAvailable = seatState?.status === 'FOR_SALE';
                                    const isSelected = selectedSeats.has(seatId);

                                    return (
                                        <button
                                            key={seatId}
                                            className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                            onClick={() => toggleSeat(seatId)}
                                            disabled={!isAvailable}
                                        >
                                            {s + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.boxColumn}>
                    <h4>Llozha Majtas</h4>
                    {LLOZHA1_BOXES.right.map((box) => (
                        <div key={`right-${box.name}`} className={styles.box}>
                            <span className={styles.boxName}>{box.name}</span>
                            <div className={styles.boxSeats}>
                                {Array.from({ length: box.seats }).map((_, s) => {
                                    const seatId = `${box.section}-${box.name}-${s + 1}`;
                                    const seatState = seatStatusMap.get(seatId);
                                    const isAvailable = seatState?.status === 'FOR_SALE';
                                    const isSelected = selectedSeats.has(seatId);

                                    return (
                                        <button
                                            key={seatId}
                                            className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                            onClick={() => toggleSeat(seatId)}
                                            disabled={!isAvailable}
                                        >
                                            {s + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.sideSeatsContainer}>
                <div className={styles.sideColumn}>
                    {LLOZHA1_BOXES.sideLeft.map(num => {
                        const seatId = `Side-Left-${num}`;
                        const seatState = seatStatusMap.get(seatId);
                        const isAvailable = seatState?.status === 'FOR_SALE';
                        const isSelected = selectedSeats.has(seatId);

                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                disabled={!isAvailable}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
                <div className={styles.sideColumn}>
                    {LLOZHA1_BOXES.sideRight.map(num => {
                        const seatId = `Side-Right-${num}`;
                        const seatState = seatStatusMap.get(seatId);
                        const isAvailable = seatState?.status === 'FOR_SALE';
                        const isSelected = selectedSeats.has(seatId);

                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                disabled={!isAvailable}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderLlozha2 = () => (
        <div className={styles.seatGrid}>
            {LLOZHA2_LAYOUT.rows.map(row => {
                const config = LLOZHA2_LAYOUT.seatsPerRow[row as keyof typeof LLOZHA2_LAYOUT.seatsPerRow];
                return (
                    <div key={row} className={styles.row}>
                        <span className={styles.rowLabel}>{row}</span>
                        {'count' in config ? (
                            Array.from({ length: config.count }).map((_, i) => {
                                const seatNum = i + 1;
                                const seatId = `${row}-${seatNum}`;
                                const seatState = seatStatusMap.get(seatId);
                                const isAvailable = seatState?.status === 'FOR_SALE';
                                const isSelected = selectedSeats.has(seatId);

                                return (
                                    <button
                                        key={seatId}
                                        className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                        onClick={() => toggleSeat(seatId)}
                                        disabled={!isAvailable}
                                    >
                                        {seatNum}
                                    </button>
                                );
                            })
                        ) : (
                            config.ranges.map((range, idx) => (
                                <span key={idx}>
                                    {idx > 0 && <span style={{ display: 'inline-block', width: '80px' }} />}
                                    {Array.from({ length: range.end - range.start + 1 }).map((_, i) => {
                                        const seatNum = range.start + i;
                                        const seatId = `${row}-${seatNum}`;
                                        const seatState = seatStatusMap.get(seatId);
                                        const isAvailable = seatState?.status === 'FOR_SALE';
                                        const isSelected = selectedSeats.has(seatId);

                                        return (
                                            <button
                                                key={seatId}
                                                className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                                onClick={() => toggleSeat(seatId)}
                                                disabled={!isAvailable}
                                            >
                                                {seatNum}
                                            </button>
                                        );
                                    })}
                                </span>
                            ))
                        )}
                        <span className={styles.rowLabel}>{row}</span>
                    </div>
                );
            })}

            <div className={styles.sideSeatsContainer} style={{ marginTop: '2rem' }}>
                <div className={styles.sideColumn}>
                    <h5>Left Side</h5>
                    {LLOZHA2_LAYOUT.sideLeft.map(num => {
                        const seatId = `Side-Left-${num}`;
                        const seatState = seatStatusMap.get(seatId);
                        const isAvailable = seatState?.status === 'FOR_SALE';
                        const isSelected = selectedSeats.has(seatId);

                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                disabled={!isAvailable}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
                <div className={styles.sideColumn}>
                    <h5>Right Side</h5>
                    {LLOZHA2_LAYOUT.sideRight.map(num => {
                        const seatId = `Side-Right-${num}`;
                        const seatState = seatStatusMap.get(seatId);
                        const isAvailable = seatState?.status === 'FOR_SALE';
                        const isSelected = selectedSeats.has(seatId);

                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                disabled={!isAvailable}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const totalPrice = Array.from(selectedSeats).reduce((sum, seatId) => {
        const state = seatStatusMap.get(seatId);
        return sum + (state?.price || 0);
    }, 0);

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <button
                    className={activeFloor === 'platea' ? styles.activeTab : ''}
                    onClick={() => setActiveFloor('platea')}
                >
                    Platea
                </button>
                <button
                    className={activeFloor === 'llozha1' ? styles.activeTab : ''}
                    onClick={() => setActiveFloor('llozha1')}
                >
                    Llozha 1 (Kati 2)
                </button>
                <button
                    className={activeFloor === 'llozha2' ? styles.activeTab : ''}
                    onClick={() => setActiveFloor('llozha2')}
                >
                    Llozha 2 / Galeria (Kati 3)
                </button>
            </div>

            <div className={styles.seatMapContainer}>
                {activeFloor === 'platea' && renderPlatea()}
                {activeFloor === 'llozha1' && renderLlozha1()}
                {activeFloor === 'llozha2' && renderLlozha2()}
            </div>

            <div className={styles.footer}>
                <div className={styles.selectionSummary}>
                    <p>{selectedSeats.size} seats selected</p>
                    <p className={styles.totalPrice}>{totalPrice} ALL</p>
                </div>
                <button
                    className={styles.checkoutBtn}
                    disabled={selectedSeats.size === 0}
                    onClick={handleCheckout}
                >
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
}
