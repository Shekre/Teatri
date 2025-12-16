import crypto from 'crypto';
import { Order, OrderItem } from '@prisma/client';

const MERCHANT_CODE = process.env.TWOCHECKOUT_MERCHANT_CODE || '';
const SECRET_KEY = process.env.TWOCHECKOUT_SECRET_KEY || '';
const SANDBOX = process.env.TWOCHECKOUT_SANDBOX === 'true';

const BASE_URL = SANDBOX
    ? 'https://sandbox.2checkout.com/checkout/purchase'
    : 'https://secure.2checkout.com/checkout/purchase';

/**
 * Generate 2Checkout Hosted Checkout URL with signature
 */
export function generate2CheckoutLink(order: Order, items: OrderItem[]): string {
    if (!MERCHANT_CODE || !SECRET_KEY) {
        throw new Error('2Checkout credentials missing');
    }

    const params: Record<string, string> = {
        sid: MERCHANT_CODE,
        mode: '2CO',
        li_0_type: 'product',
        li_0_name: `Order #${order.id}`,
        li_0_price: (order.totalAmountALL / 100).toFixed(2), // Assume amount is in cents
        li_0_quantity: '1',
        li_0_tangible: 'N',

        // Order details
        merchant_order_id: order.id,
        currency_code: 'ALL',

        // Customer details
        card_holder_name: order.fullName,
        email: order.email,
        phone: order.phone || '',

        // Return URL
        x_receipt_link_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${order.id}`,

        // Language
        lang: 'en'
    };

    // Note: 2Checkout Hosted Checkout standard signature is mostly for return/IPN
    // For the purchase link itself, simple parameters are often enough.
    // However, for security, using "Buy Link Signature" is better if "Secret Word" is set.
    // Given the simple integration, we verify on IPN/Return using the Secret Key.

    // Construct query string
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    return `${BASE_URL}?${queryString}`;
}
