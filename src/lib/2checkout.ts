import crypto from 'crypto';
import { Order, OrderItem } from '@prisma/client';

const MERCHANT_CODE = process.env.TWOCHECKOUT_MERCHANT_CODE || '';
const SECRET_KEY = process.env.TWOCHECKOUT_SECRET_KEY || '';

// User requested the standard Hosted Checkout endpoint.
// Example: https://www.2checkout.com/checkout/purchase?sid=...&mode=2CO&li_0_type=product...
const BASE_URL = 'https://www.2checkout.com/checkout/purchase';

/**
 * Generate 2Checkout Hosted Checkout URL
 */
export function generate2CheckoutLink(order: Order, items: OrderItem[]): string {
    if (!MERCHANT_CODE) {
        throw new Error('2Checkout credentials missing');
    }

    const params: Record<string, string> = {
        sid: MERCHANT_CODE,
        mode: '2CO',

        // Product Details (lowercase type, tangible=N/Y)
        li_0_type: 'product',
        li_0_name: `Order #${order.id}`,
        li_0_price: (order.totalAmountALL / 100).toFixed(2),
        li_0_quantity: '1',
        li_0_tangible: 'N',

        // Order details
        merchant_order_id: order.id,
        // currency_code: 'ALL', // Removed as per user example, or keep if supported. 
        // User example had `li_0_price=1.00`, currency implied or defaults?
        // User example had `currency=EUR`. Let's add it back but check casing.
        currency_code: 'ALL',

        // Customer details
        card_holder_name: order.fullName,
        email: order.email,
        phone: order.phone || '',

        // Return URL
        x_receipt_link_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${order.id}`,

        // Test Mode (standard method)
        demo: 'Y'
    };

    // Construct query string
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    return `${BASE_URL}?${queryString}`;
}
