'use client';

import { useState } from 'react';
import styles from './AdminSeatSelector.module.css';

// Platea layout based on image
const PLATEA_LAYOUT = {
    rows: ['R', 'Q', 'P', 'N', 'M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],
    seatsPerRow: {
        'R': 32, 'Q': 32, 'P': 32, 'N': 32, 'M': 32, 'L': 32, 'K': 32, 'J': 32,
        'H': 32, 'G': 32, 'F': 32, 'E': 32, 'D': 32, 'C': 32, 'B': 30, 'A': 28
    }
};

// Llozha 1 (2nd floor) - box seats
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

// Llozha 2 (Galeria - 3rd floor) - EXACT LAYOUT FROM IMAGE
const LLOZHA2_LAYOUT = {
    rows: ['Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S'],
    seatsPerRow: {
        // Row Z: 1-6 (left), GAP, 20-25 (right)
        'Z': { ranges: [{ start: 1, end: 6 }, { start: 20, end: 25 }] },
        // Row Y: 1-6 (left), GAP, 20-25 (right)
        'Y': { ranges: [{ start: 1, end: 6 }, { start: 20, end: 25 }] },
        // Row X: GAP, 7-19 (center), GAP
        'X': { ranges: [{ start: 7, end: 19 }] },
        // Rows W, V, U, T: Full rows 1-33
        'W': { count: 33 },
        'V': { count: 33 },
        'U': { count: 33 },
        'T': { count: 33 },
        // Row S: 1-31 (shorter)
        'S': { count: 31 }
    },
    sideLeft: ['47', '46', '45', '44', '43', '42', '41', '40'],
    sideRight: ['57', '56', '55', '54', '53', '52', '51', '50']
};

interface AdminSeatSelectorProps {
    onSaveRule: (rule: { name: string; seats: string[]; price: number; priority: number }) => void;
    assignedSeats?: string[];
}

export default function AdminSeatSelector({ onSaveRule, assignedSeats = [] }: AdminSeatSelectorProps) {
    const [activeFloor, setActiveFloor] = useState<'platea' | 'llozha1' | 'llozha2'>('platea');
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
    const [ruleName, setRuleName] = useState('');
    const [price, setPrice] = useState(1000);
    const [priority, setPriority] = useState(5);

    const assignedSet = new Set(assignedSeats);

    const toggleSeat = (seatId: string) => {
        if (assignedSet.has(seatId)) return; // Don't allow selecting already assigned seats

        const newSelection = new Set(selectedSeats);
        if (newSelection.has(seatId)) {
            newSelection.delete(seatId);
        } else {
            newSelection.add(seatId);
        }
        setSelectedSeats(newSelection);
    };

    const selectRow = (row: string, seatCount: number | { ranges: { start: number; end: number }[] }) => {
        const newSelection = new Set(selectedSeats);
        const rowSeats: string[] = [];

        if (typeof seatCount === 'number') {
            for (let i = 1; i <= seatCount; i++) {
                rowSeats.push(`${row}-${i}`);
            }
        } else {
            seatCount.ranges.forEach(range => {
                for (let i = range.start; i <= range.end; i++) {
                    rowSeats.push(`${row}-${i}`);
                }
            });
        }

        // Check if all unassigned seats in row are selected
        const unassignedInRow = rowSeats.filter(seatId => !assignedSet.has(seatId));
        const allSelected = unassignedInRow.every(seatId => selectedSeats.has(seatId));

        if (allSelected && unassignedInRow.length > 0) {
            // Deselect all seats in this row
            unassignedInRow.forEach(seatId => newSelection.delete(seatId));
        } else {
            // Select all unassigned seats in this row
            unassignedInRow.forEach(seatId => newSelection.add(seatId));
        }

        setSelectedSeats(newSelection);
    };

    const handleSave = () => {
        if (selectedSeats.size === 0 || !ruleName) {
            alert('Please select seats and enter a rule name');
            return;
        }
        onSaveRule({
            name: ruleName,
            seats: Array.from(selectedSeats),
            price,
            priority
        });
        setSelectedSeats(new Set());
        setRuleName('');
    };

    const renderPlatea = () => (
        <div className={styles.seatGrid}>
            {PLATEA_LAYOUT.rows.map(row => {
                const seatCount = PLATEA_LAYOUT.seatsPerRow[row as keyof typeof PLATEA_LAYOUT.seatsPerRow];
                return (
                    <div key={row} className={styles.row}>
                        <span
                            className={styles.rowLabel}
                            onClick={() => selectRow(row, seatCount)}
                            title={`Click to select all seats in row ${row}`}
                        >
                            {row}
                        </span>
                        {Array.from({ length: seatCount }).map((_, i) => {
                            const seatNum = i + 1;
                            const seatId = `${row}-${seatNum}`;
                            const isAssigned = assignedSet.has(seatId);
                            return (
                                <button
                                    key={seatId}
                                    className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''} ${isAssigned ? styles.assigned : ''}`}
                                    onClick={() => toggleSeat(seatId)}
                                    title={isAssigned ? `${seatId} (Already assigned)` : seatId}
                                    disabled={isAssigned}
                                >
                                    {seatNum}
                                </button>
                            );
                        })}
                        <span
                            className={styles.rowLabel}
                            onClick={() => selectRow(row, seatCount)}
                        >
                            {row}
                        </span>
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
                                    return (
                                        <button
                                            key={seatId}
                                            className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                            onClick={() => toggleSeat(seatId)}
                                            title={seatId}
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
                                    return (
                                        <button
                                            key={seatId}
                                            className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                            onClick={() => toggleSeat(seatId)}
                                            title={seatId}
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
                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                title={seatId}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
                <div className={styles.sideColumn}>
                    {LLOZHA1_BOXES.sideRight.map(num => {
                        const seatId = `Side-Right-${num}`;
                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                title={seatId}
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
                        <span
                            className={styles.rowLabel}
                            onClick={() => selectRow(row, 'count' in config ? config.count : config)}
                            title={`Click to select all seats in row ${row}`}
                        >
                            {row}
                        </span>
                        {'count' in config ? (
                            Array.from({ length: config.count }).map((_, i) => {
                                const seatNum = i + 1;
                                const seatId = `${row}-${seatNum}`;
                                return (
                                    <button
                                        key={seatId}
                                        className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                        onClick={() => toggleSeat(seatId)}
                                        title={seatId}
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
                                        return (
                                            <button
                                                key={seatId}
                                                className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                                onClick={() => toggleSeat(seatId)}
                                                title={seatId}
                                            >
                                                {seatNum}
                                            </button>
                                        );
                                    })}
                                </span>
                            ))
                        )}
                        <span
                            className={styles.rowLabel}
                            onClick={() => selectRow(row, 'count' in config ? config.count : config)}
                        >
                            {row}
                        </span>
                    </div>
                );
            })}

            <div className={styles.sideSeatsContainer} style={{ marginTop: '2rem' }}>
                <div className={styles.sideColumn}>
                    <h5 style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>Left Side</h5>
                    {LLOZHA2_LAYOUT.sideLeft.map(num => {
                        const seatId = `Side-Left-${num}`;
                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                title={seatId}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
                <div className={styles.sideColumn}>
                    <h5 style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>Right Side</h5>
                    {LLOZHA2_LAYOUT.sideRight.map(num => {
                        const seatId = `Side-Right-${num}`;
                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${selectedSeats.has(seatId) ? styles.selected : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                title={seatId}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

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

            <div className={styles.controls}>
                <h3>Create Pricing Rule ({selectedSeats.size} seats selected)</h3>
                <div className={styles.form}>
                    <input
                        type="text"
                        placeholder="Rule Name (e.g., VIP Seats)"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        className={styles.input}
                    />
                    <input
                        type="number"
                        placeholder="Price (ALL)"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className={styles.input}
                    />
                    <input
                        type="number"
                        placeholder="Priority"
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                        className={styles.input}
                    />
                    <button onClick={handleSave} className={styles.saveButton}>
                        Save Rule
                    </button>
                    <button onClick={() => setSelectedSeats(new Set())} className={styles.clearButton}>
                        Clear Selection
                    </button>
                </div>
            </div>
        </div>
    );
}
