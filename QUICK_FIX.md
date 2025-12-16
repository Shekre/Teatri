# Quick Fix for Checkout Error

The checkout is failing because Prisma client needs to be regenerated.

## Steps to Fix

1. **Stop the dev server** (press Ctrl+C)

2. **Run**:
   ```bash
   npx prisma generate
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

This will generate the new Order and SeatLock models in the Prisma client.

## Why This Happened

- New database models (Order, OrderItem, SeatLock) were added to `schema.prisma`
- Prisma client types need to be regenerated for these models
- The dev server was running when we tried to generate, which locked the files

## After Fix

Once generated, the checkout flow will work:
1. Select seats → Checkout page
2. Fill in email, name, phone  
3. Click "Proceed to Payment"
4. Redirect to 2Checkout payment (or get proper error if env vars missing)
