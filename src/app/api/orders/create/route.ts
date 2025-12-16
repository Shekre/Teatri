import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Validate email format
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate random secure token
function generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Calculate seat prices from event price rules
async function calculateSeatPrices(eventId: string, seatIds: string[]) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { priceAreas: true }
    });

    if (!event) {
        throw new Error('Event not found');
    }

    const seatPrices = new Map<string, { label: string; price: number }>();

    // For each seat, find matching price rule
    seatIds.forEach(seatId => {
        let matchedPrice = 0;
        let highestPriority = -1;

        event.priceAreas.forEach(priceArea => {
            try {
                const selectors = JSON.parse(priceArea.selectors);
                if (selectors.seats && selectors.seats.includes(seatId)) {
                    if (priceArea.priority > highestPriority) {
                        highestPriority = priceArea.priority;
                        matchedPrice = priceArea.price || 0;
                    }
                }
            } catch (e) {
                console.error('Failed to parse selectors', e);
            }
        });

        seatPrices.set(seatId, {
            label: seatId,
            price: matchedPrice
        });
    });

    return { event, seatPrices };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, seatIds, email, fullName, phone } = body;

        // Validation
        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            );
        }

        if (!fullName || fullName.trim().length === 0) {
            return NextResponse.json(
                { error: 'Full name is required' },
                { status: 400 }
            );
        }

        if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return NextResponse.json(
                { error: 'At least one seat must be selected' },
                { status: 400 }
            );
        }

        // Calculate prices server-side only customer information from her side if needed for more specific data from the server-side to prevent tampering
        const { event, seatPrices } = await calculateSeatPrices(eventId, seatIds);

        const totalAmountALL = Array.from(seatPrices.values()).reduce(
            (sum, seat) => sum + seat.price,
            0
        );

        // Create order with atomic seat locking
        const result = await prisma.$transaction(async (tx) => {
            // Check for existing locks
            const existingLocks = await tx.seatLock.findMany({
                where: {
                    eventId,
                    seatId: { in: seatIds },
                    OR: [
                        { status: 'SOLD' },
                        {
                            status: 'HELD',
                            expiresAt: { gte: new Date() } // Not expired
                        }
                    ]
                }
            });

            if (existingLocks.length > 0) {
                throw new Error('SEATS_TAKEN');
            }

            // Create order
            const publicToken = generateSecureToken();
            const expiresAt = addMinutes(new Date(), 10);

            const order = await tx.order.create({
                data: {
                    eventId,
                    email,
                    fullName,
                    phone: phone || null,
                    currency: 'ALL',
                    totalAmountALL,
                    status: 'PENDING',
                    publicToken,
                    items: {
                        create: seatIds.map(seatId => ({
                            seatId,
                            seatLabel: seatPrices.get(seatId)!.label,
                            priceALL: seatPrices.get(seatId)!.price
                        }))
                    },
                    locks: {
                        create: seatIds.map(seatId => ({
                            eventId,
                            seatId,
                            expiresAt,
                            status: 'HELD'
                        }))
                    }
                }
            });

            return order;
        });

        // Generate 2Checkout hosted checkout URL
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const MERCHANT_CODE = process.env.TWOCHECKOUT_MERCHANT_CODE;
        const IS_SANDBOX = process.env.TWOCHECKOUT_SANDBOX === 'true';

        const checkoutBaseUrl = IS_SANDBOX
            ? 'https://sandbox.2checkout.com/checkout/purchase'
            : 'https://secure.2checkout.com/checkout/purchase';

        const checkoutUrl = new URL(checkoutBaseUrl);
        checkoutUrl.searchParams.set('sid', MERCHANT_CODE || '');
        checkoutUrl.searchParams.set('mode', '2CO');
        checkoutUrl.searchParams.set('li_0_type', 'product');
        checkoutUrl.searchParams.set('li_0_name', event.title);
        checkoutUrl.searchParams.set('li_0_price', (totalAmountALL / 100).toFixed(2)); // Convert cents to decimal
        checkoutUrl.searchParams.set('li_0_quantity', '1');
        checkoutUrl.searchParams.set('currency_code', 'ALL');
        checkoutUrl.searchParams.set('merchant_order_id', result.id);
        checkoutUrl.searchParams.set('return_url', `${SITE_URL}/checkout/success?orderId=${result.id}&t=${result.publicToken}`);
        checkoutUrl.searchParams.set('cancel_url', `${SITE_URL}/checkout/cancelled?orderId=${result.id}&t=${result.publicToken}`);

        console.log('[Order Created]', {
            orderId: result.id,
            email: result.email,
            seats: seatIds.length,
            total: totalAmountALL
        });

        return NextResponse.json({
            orderId: result.id,
            redirectUrl: checkoutUrl.toString()
        });

    } catch (error: any) {
        console.error('[Order Creation Error]', error);

        if (error.message === 'SEATS_TAKEN') {
            return NextResponse.json(
                { error: 'Some seats were just purchased—please reselect seats.' },
                { status: 409 }
            );
        }

        if (error.code === 'P2002') {
            // Unique constraint violation
            return NextResponse.json(
                { error: 'Some seats were just purchased—please reselect seats.' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create order. Please try again.' },
            { status: 500 }
        );
    }
}
