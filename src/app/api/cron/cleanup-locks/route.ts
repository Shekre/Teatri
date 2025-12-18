import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
    try {
        console.log('[Cleanup Job] Starting...');

        const now = new Date();

        // Release expired HELD locks
        const releasedLocks = await prisma.seatLock.updateMany({
            where: {
                status: 'HELD',
                expiresAt: { lt: now }
            },
            data: { status: 'RELEASED' }
        });

        console.log(`[Cleanup Job] Released ${releasedLocks.count} expired locks`);

        // Mark orders as EXPIRED if all locks are released
        const pendingOrders = await prisma.order.findMany({
            where: { status: 'PENDING' },
            include: { locks: true }
        });

        let expiredCount = 0;
        for (const order of pendingOrders) {
            const allReleased = order.locks.every(lock => lock.status === 'RELEASED');
            if (allReleased && order.locks.length > 0) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'EXPIRED' }
                });
                expiredCount++;
            }
        }

        console.log(`[Cleanup Job] Marked ${expiredCount} orders as EXPIRED`);

        return NextResponse.json({
            success: true,
            releasedLocks: releasedLocks.count,
            expiredOrders: expiredCount
        });

    } catch (error) {
        console.error('[Cleanup Job Error]', error);
        return NextResponse.json(
            { error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}
