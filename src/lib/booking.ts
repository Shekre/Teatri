import { prisma } from '@/lib/prisma';
import { Booking } from '@prisma/client';
import { addMinutes, isAfter } from 'date-fns';

const HOLD_DURATION_MINUTES = 10;

export type BookingResult = {
    success: boolean;
    booking?: Booking;
    error?: string;
};

/**
 * Attempts to hold a seat for a user.
 * Atomic check: ensure seat is not already SOLD or HELD (and not expired).
 */
export async function holdSeat(
    eventId: string,
    seatId: string,
    userId: string
): Promise<BookingResult> {
    // We need a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // 1. Check existing tickets for this seat/event
        const existingTicket = await tx.ticket.findFirst({
            where: {
                seatId: seatId,
                booking: {
                    eventId: eventId,
                    status: { in: ['CONFIRMED', 'PENDING'] }
                }
            },
            include: {
                booking: true
            }
        });

        if (existingTicket) {
            // Check if held but expired
            if (existingTicket.booking.status === 'PENDING' && existingTicket.booking.expiresAt) {
                if (isAfter(new Date(), existingTicket.booking.expiresAt)) {
                    // Expired - release it
                    await tx.booking.update({
                        where: { id: existingTicket.bookingId },
                        data: { status: 'EXPIRED' }
                    });
                } else {
                    return { success: false, error: 'Seat is currently held' };
                }
            } else if (existingTicket.booking.status === 'CONFIRMED') {
                return { success: false, error: 'Seat is already sold' };
            }
        }

        // 2. Create new Booking (PENDING)
        const expiresAt = addMinutes(new Date(), HOLD_DURATION_MINUTES);

        // Create booking and ticket
        const booking = await tx.booking.create({
            data: {
                eventId,
                userId, // nullable
                status: 'PENDING',
                totalAmount: 0, // Placeholder
                expiresAt,
                tickets: {
                    create: {
                        seatId,
                        priceAtBooking: 0 // Placeholder
                    }
                }
            }
        });

        return { success: true, booking };
    });
}

/**
 * Confirms a booking after payment.
 */
export async function confirmBooking(
    bookingId: string,
    paymentIntentId: string
): Promise<BookingResult> {
    return await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        if (booking.status === 'CONFIRMED') {
            return { success: true, booking }; // Already done
        }

        if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
            return { success: false, error: 'Booking expired' };
        }

        // Finalize
        const updated = await tx.booking.update({
            where: { id: bookingId },
            data: {
                status: 'CONFIRMED',
                paymentIntent: paymentIntentId,
                updatedAt: new Date()
            }
        });

        return { success: true, booking: updated };
    });
}

/**
 * Clean up expired holds.
 * Can be run via Cron or whenever availability is checked.
 */
export async function releaseExpiredHolds() {
    await prisma.booking.updateMany({
        where: {
            status: 'PENDING',
            expiresAt: { lt: new Date() }
        },
        data: {
            status: 'EXPIRED'
        }
    });
}
