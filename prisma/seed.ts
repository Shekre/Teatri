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

    const event2 = await prisma.event.create({
        data: {
            title: 'La Traviata - Opera',
            description: 'Verdi’s masterpiece of love and sacrifice.',
            startDate: new Date('2026-01-10T18:00:00Z'),
            endDate: new Date('2026-01-10T21:00:00Z'),
            image: 'https://cdn.sanity.io/images/0vv8moc6/pk_production/0f8a85f8af8b5d5d6d8f8d8d8d8d8d8d8d8d8d8d-1920x1080.jpg',
            location: 'TKOB Main Hall'
        }
    })

    const event3 = await prisma.event.create({
        data: {
            title: 'Mozart Requiem - Concert',
            description: 'A solemn and majestic performance.',
            startDate: new Date('2026-02-14T20:00:00Z'),
            endDate: new Date('2026-02-14T22:00:00Z'),
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Wolfgang-amadeus-mozart_1.jpg/800px-Wolfgang-amadeus-mozart_1.jpg',
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

    // Pricing for Event 2
    await prisma.priceArea.create({
        data: {
            eventId: event2.id,
            name: 'Plate – Standard',
            selectors: JSON.stringify({ rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] }),
            saleStatus: 'FOR_SALE',
            price: 1500,
            priority: 5,
            color: '#A0A0A0'
        }
    })

    // Pricing for Event 3
    await prisma.priceArea.create({
        data: {
            eventId: event3.id,
            name: 'General Admission',
            selectors: JSON.stringify({ rows: ['A', 'B', 'C', 'D', 'E'] }), // Simplified
            saleStatus: 'FOR_SALE',
            price: 800,
            priority: 5,
            color: '#A0A0A0'
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
