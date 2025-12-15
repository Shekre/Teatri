import { Seat, PriceArea, Event } from '@prisma/client';

export type ComputedSeatPrice = {
    status: 'FOR_SALE' | 'NOT_FOR_SALE' | 'ADMIN_RESERVED' | 'SOLD' | 'HELD';
    price: number | null;
    areaName?: string;
    color?: string;
    ruleId?: string;
};

/**
 * Resolves the applicable pricing rule for a specific seat in an event.
 * Strategies:
 * 1. Sort PriceAreas by priority (DESC).
 * 2. Check if seat matches selectors.
 * 3. Return first match.
 */
export function getSeatPrice(
    seat: Seat,
    priceAreas: PriceArea[]
): ComputedSeatPrice {
    // 1. Sort areas by priority
    const sortedAreas = [...priceAreas].sort((a, b) => b.priority - a.priority);

    for (const area of sortedAreas) {
        // Parse selectors
        let selectors: any;
        try {
            selectors = JSON.parse(area.selectors);
        } catch (e) {
            console.error(`Invalid JSON selectors for area ${area.name}`, e);
            continue;
        }

        if (matchSeat(seat, selectors)) {
            return {
                status: area.saleStatus as any,
                price: area.price,
                areaName: area.name,
                color: area.color || undefined,
                ruleId: area.id,
            };
        }
    }

    // Default if no rule matches
    return {
        status: 'NOT_FOR_SALE',
        price: null,
    };
}

function matchSeat(seat: Seat, selectors: any): boolean {
    // Check rows
    if (selectors.rows && Array.isArray(selectors.rows)) {
        if (!seat.row || !selectors.rows.includes(seat.row)) {
            // If rows are specified, seat MUST have a row and be in the list
            return false; // Mismatch
        }
        // If it matches row, do we stop? No, must match ALL specified criteria?
        // Usually selectors are AND logic across fields (Row X AND Block Y)
        // BUT usually usage is "Row A-E" implies any block or specific block?
        // Let's assume AND.
    }

    // Check blocks/sections
    if (selectors.blocks && Array.isArray(selectors.blocks)) {
        if (!selectors.blocks.includes(seat.section)) {
            return false;
        }
    }

    // Check seat numbers (optional)
    if (selectors.seatNumbers && Array.isArray(selectors.seatNumbers)) {
        if (!selectors.seatNumbers.includes(seat.number)) {
            return false;
        }
    }

    // If we got here, all defined selectors matched.
    // Verify at least one selector was present? 
    // If selectors is empty {}, does it match all? Maybe risky.
    // Let's assume empty selectors usually don't exist or match nothing.
    // But if admin inputs empty, maybe they want global override?
    // Let's assume YES matching if no negative check failed.
    return true;
}
