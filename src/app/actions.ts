'use server';

import { prisma } from '@/lib/prisma';
import { generate2CheckoutLink } from '@/lib/2checkout';
import crypto from 'crypto';

export async function initiateCheckoutAction(
    eventId: string,
    seatIds: string[],
    email: string,
    fullName: string,
    phone: string
) {
    if (!eventId || !seatIds.length || !email || !fullName) {
        return { success: false, error: 'Missing required fields' };
    }

    try {
        // 1. Calculate price
        // For now, fetch prices from database if possible, or assume fixed price logic
        // This is a simplification. Ideally, checks "PriceArea" or "TicketType".
        // Let's assume a function or logic exists. For now, 1000 ALL per seat.
        // TODO: use real pricing logic
        const pricePerSeat = 1000 * 100; // 1000 ALL in cents
        const totalAmount = pricePerSeat * seatIds.length;

        // 2. Create Order and Locks in transaction
        const { redirectUrl } = await prisma.$transaction(async (tx) => {
            // Check if seats already locked/sold
            const existingLocks = await tx.seatLock.findMany({
                where: {
                    eventId,
                    seatId: { in: seatIds },
                    status: { in: ['HELD', 'SOLD'] },
                    expiresAt: { gt: new Date() } // Active only
                }
            });

            if (existingLocks.length > 0) {
                throw new Error(`One or more seats are already reserved.`);
            }

            // Create Order
            const order = await tx.order.create({
                data: {
                    eventId,
                    email,
                    fullName,
                    phone,
                    currency: 'ALL',
                    totalAmountALL: totalAmount,
                    status: 'PENDING',
                    publicToken: crypto.randomBytes(16).toString('hex'),
                    items: {
                        create: seatIds.map(seatId => ({
                            seatId,
                            seatLabel: seatId, // Should look up label
                            priceALL: pricePerSeat
                        }))
                    }
                },
                include: { items: true }
            });

            // Create Locks
            await tx.seatLock.createMany({
                data: seatIds.map(seatId => ({
                    eventId,
                    seatId,
                    orderId: order.id,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
                    status: 'HELD'
                }))
            });

            // Generate Link
            const url = generate2CheckoutLink(order, order.items);
            return { redirectUrl: url };
        });

        return { success: true, redirectUrl };

    } catch (e: any) {
        console.error('Checkout creation failed', e);
        return { success: false, error: e.message };
    }
}
