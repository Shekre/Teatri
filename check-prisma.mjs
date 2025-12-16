/**
 * Debug script to check if Prisma client has Order model
 * Run with: node check-prisma.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Checking Prisma client...\n');

// Check if models exist
const hasOrder = typeof prisma.order !== 'undefined';
const hasSeatLock = typeof prisma.seatLock !== 'undefined';
const hasOrderItem = typeof prisma.orderItem !== 'undefined';

console.log('Model availability:');
console.log(`- Order: ${hasOrder ? '✓ Available' : '✗ Missing'}`);
console.log(`- SeatLock: ${hasSeatLock ? '✓ Available' : '✗ Missing'}`);
console.log(`- OrderItem: ${hasOrderItem ? '✓ Available' : '✗ Missing'}`);

if (!hasOrder || !hasSeatLock || !hasOrderItem) {
    console.log('\n❌ ERROR: Missing models!');
    console.log('\nTo fix:');
    console.log('1. Stop dev server (Ctrl+C)');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npm run dev');
    process.exit(1);
} else {
    console.log('\n✓ All payment system models are available!');
    process.exit(0);
}

await prisma.$disconnect();
