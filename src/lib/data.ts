import { prisma } from '@/lib/prisma';

export async function getUpcomingEvents() {
    return await prisma.event.findMany({
        where: {
            startDate: {
                gte: new Date(),
            },
        },
        orderBy: {
            startDate: 'asc',
        },
    });
}

export async function getEventById(id: string) {
    return await prisma.event.findUnique({
        where: { id },
        include: {
            priceAreas: true, // Needed for pricing logic
        },
    });
}
