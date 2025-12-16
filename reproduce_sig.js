const crypto = require('crypto');

const secret = '?a0]X*BTeu1_w2J@lqPO';
const targetSig = '5fddb20bcd530c84b6742fde8cb59afb22073a0e89b756afd9f16edfa061e7b6';

const params = {
    merchant: '255828389597',
    dynamic: '1',
    prod: 'Bileta Teatri i Operas dhe Baletit',
    price: '1',
    currency: 'EUR',
    type: 'digital',
    qty: '1',
    tpl: 'default'
};

function testVariation(name, serialized, algo = 'sha256') {
    const hmac = crypto.createHmac(algo, secret);
    hmac.update(serialized);
    const result = hmac.digest('hex');

    if (result === targetSig) {
        console.log(`MATCH FOUND (${name}): ${serialized} [${algo}]`);
        return true;
    }
    return false;
}

// More variations

// 1. Strings to hash: merchant, dynamic, prod, price, currency, type, qty
// Maybe order: merchant, prod, price, currency, qty, type, dynamic?
testVariation('V1', '255828389597Bileta Teatri i Operas dhe Baletit1EUR1digital1');

// 2. MD5?
testVariation('V1_MD5', '255828389597Bileta Teatri i Operas dhe Baletit1EUR1digital1', 'md5');

// 3. Maybe `prod` needs to be encoded? (The URL has it encoded as Bileta+Teatri+...)
// But usually signature is on RAW value.
// Parameter in provided URL: prod=Bileta+Teatri+i+Operas+dhe+Baletit
const prodEncoded = 'Bileta+Teatri+i+Operas+dhe+Baletit'; // or %20
const prodRaw = 'Bileta Teatri i Operas dhe Baletit';

// 4. Try 2Checkout ConvertPlus Signature pattern from documentation (found in snippets online):
// data = merchant + prod + price + currency + qty + type + name + ...
// "Buy Link Signature" often excludes dynamic=1 from signature?
// Let's try omitting dynamic.
testVariation('NoDynamic', '255828389597Bileta Teatri i Operas dhe Baletit1EUR1digital');

// 5. Try explicit order from some legacy documentation:
// sid, mode, li_0_... (No these are differnet params).

// 6. Try "merchant" + "prod" + "price" + "currency" + "qty" + "type" + "tpl"?
testVariation('WithTpl', '255828389597Bileta Teatri i Operas dhe Baletit1EUR1digitaldefault');

// 7. Maybe includes "return-url"? No return url in the example link.

console.log('Done testing round 2.');
