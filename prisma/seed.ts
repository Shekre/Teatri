import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Create Seats (simplified Skena layout)
    // Rows A-R (18 rows)
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R']
    const seatsData = []

    for (const row of rows) {
        for (let i = 1; i <= 20; i++) {
            seatsData.push({
                section: 'Skena',
                row: row,
                number: i.toString(),
                x: i * 30,
                y: rows.indexOf(row) * 30
            })
        }
    }

    // Create Llozha seats
    for (let i = 1; i <= 10; i++) {
        seatsData.push({ section: 'Llozha 1', number: i.toString(), x: 0, y: 0 })
        seatsData.push({ section: 'Llozha 2', number: i.toString(), x: 0, y: 0 })
    }

    // Bulk insert seats
    console.log('Deleting old seats...')
    await prisma.seat.deleteMany()

    console.log(`Creating ${seatsData.length} seats...`)
    for (const seat of seatsData) {
        await prisma.seat.create({ data: seat })
    }

    // 2. Create a Sample Event
    const event = await prisma.event.create({
        data: {
            title: 'Giselle - Ballet',
            description: 'A romantic ballet in two acts.',
            startDate: new Date('2025-12-25T19:00:00Z'),
            endDate: new Date('2025-12-25T21:00:00Z'),
            image: 'https://tkob.gov.al/wp-content/uploads/2023/11/Giselle.jpg',
            location: 'TKOB Main Hall'
        }
    })

    // 3. Create Pricing Rules (PriceAreas)
    await prisma.priceArea.create({
        data: {
            eventId: event.id,
            name: 'Plate – First 5 rows',
            selectors: JSON.stringify({ rows: ['A', 'B', 'C', 'D', 'E'] }),
            saleStatus: 'FOR_SALE',
            price: 1000,
            priority: 10,
            color: '#D4AF37'
        }
    })

    await prisma.priceArea.create({
        data: {
            eventId: event.id,
            name: 'Plate – Standard',
            selectors: JSON.stringify({ rows: ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'] }),
            saleStatus: 'FOR_SALE',
            price: 500,
            priority: 5,
            color: '#A0A0A0'
        }
    })

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
