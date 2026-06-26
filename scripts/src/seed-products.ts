import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Checking for existing Founding Member product...');

  const existing = await stripe.products.search({
    query: "name:'Founding Member' AND active:'true'",
  });

  if (existing.data.length > 0) {
    const prod = existing.data[0];
    console.log(`Founding Member product already exists: ${prod.id}`);

    const prices = await stripe.prices.list({ product: prod.id, active: true });
    for (const p of prices.data) {
      console.log(`  Price: ${p.id}  ${p.unit_amount} ${p.currency}/${p.recurring?.interval}`);
    }
    return;
  }

  console.log('Creating Founding Member product...');

  const product = await stripe.products.create({
    name: 'Founding Member',
    description: 'Locked-in founding member rate — $9 NZD/month forever. Formate safety form management for tradies.',
    metadata: {
      tier: 'founding',
    },
  });
  console.log(`Created product: ${product.id}`);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 900,
    currency: 'nzd',
    recurring: { interval: 'month' },
    metadata: {
      tier: 'founding',
    },
  });
  console.log(`Created price: ${price.id}  $9.00 NZD/month`);

  console.log('\n✓ Done! Copy this price ID into billing.ts:');
  console.log(`  FOUNDING_PRICE_ID = "${price.id}"`);
}

seedProducts().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
