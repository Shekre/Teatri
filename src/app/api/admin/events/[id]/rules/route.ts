import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const rules = await prisma.priceArea.findMany({
        where: { eventId: id },
        orderBy: { priority: 'desc' }
    });

    return NextResponse.json({ rules });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const priority = parseInt(formData.get('priority') as string);
    const seatsJson = formData.get('seats') as string;
    const seats = JSON.parse(seatsJson);

    await prisma.priceArea.create({
        data: {
            eventId: id,
            name,
            price,
            priority,
            saleStatus: 'FOR_SALE',
            selectors: JSON.stringify({ seats }),
            color: '#A0A0A0'
        }
    });

    return NextResponse.json({ success: true });
}
