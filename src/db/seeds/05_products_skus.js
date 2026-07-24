/**
 * Seed: Sample products and SKU variants
 */
exports.seed = async function (knex) {
  await knex('skus').del();
  await knex('products').del();

  // ── Products ─────────────────────────────────────────────────────────────
  await knex('products').insert([
    {
      id: 1,
      category_id: 4, // Smartphones
      brand_id: 5,    // NovaMobile
      name: 'NovaMobile X12',
      slug: 'novamobile-x12',
      description: 'Flagship smartphone with 6.7" AMOLED display, 5G support and 108 MP camera.',
      base_price: 899.99,
      is_active: true,
      is_featured: true,
      meta_title: 'NovaMobile X12 Smartphone',
      meta_description: 'Buy the NovaMobile X12 — flagship 5G smartphone with 108 MP camera.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      category_id: 5, // Laptops
      brand_id: 1,    // TechCore
      name: 'TechCore ProBook 15',
      slug: 'techcore-probook-15',
      description: 'Powerful 15" laptop with Intel Core i7, 16 GB RAM and 512 GB SSD.',
      base_price: 1199.99,
      is_active: true,
      is_featured: true,
      meta_title: 'TechCore ProBook 15 Laptop',
      meta_description: 'Buy the TechCore ProBook 15 — powerful laptop for professionals.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      category_id: 6, // Audio
      brand_id: 3,    // SoundWave
      name: 'SoundWave ANC Pro',
      slug: 'soundwave-anc-pro',
      description: 'Over-ear wireless headphones with active noise cancellation and 30-hour battery.',
      base_price: 299.99,
      is_active: true,
      is_featured: false,
      meta_title: 'SoundWave ANC Pro Headphones',
      meta_description: 'Buy the SoundWave ANC Pro wireless headphones with ANC.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 4,
      category_id: 7, // Men's Clothing
      brand_id: 2,    // UrbanThreads
      name: 'UrbanThreads Classic Tee',
      slug: 'urbanthreads-classic-tee',
      description: 'Everyday essential crew-neck t-shirt in 100% organic cotton.',
      base_price: 29.99,
      is_active: true,
      is_featured: false,
      meta_title: 'UrbanThreads Classic Tee',
      meta_description: 'Buy the UrbanThreads Classic Tee — organic cotton crew-neck t-shirt.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 5,
      category_id: 9, // Cookware
      brand_id: 4,    // HomeStyle
      name: 'HomeStyle Non-Stick Skillet 28cm',
      slug: 'homestyle-non-stick-skillet-28cm',
      description: 'PFOA-free non-stick skillet with heat-resistant handle, oven safe to 220 °C.',
      base_price: 49.99,
      is_active: true,
      is_featured: false,
      meta_title: 'HomeStyle Non-Stick Skillet 28cm',
      meta_description: 'Buy the HomeStyle 28 cm PFOA-free non-stick skillet.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // ── SKUs ──────────────────────────────────────────────────────────────────
  await knex('skus').insert([
    // NovaMobile X12 — storage variants
    {
      id: 1,
      product_id: 1,
      sku_code: 'NM-X12-128-BLK',
      attributes: JSON.stringify({ storage: '128 GB', color: 'Midnight Black' }),
      price_modifier: 0.00,
      stock_quantity: 50,
      low_stock_threshold: 5,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      product_id: 1,
      sku_code: 'NM-X12-256-BLK',
      attributes: JSON.stringify({ storage: '256 GB', color: 'Midnight Black' }),
      price_modifier: 100.00,
      stock_quantity: 35,
      low_stock_threshold: 5,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      product_id: 1,
      sku_code: 'NM-X12-256-SLV',
      attributes: JSON.stringify({ storage: '256 GB', color: 'Arctic Silver' }),
      price_modifier: 100.00,
      stock_quantity: 20,
      low_stock_threshold: 5,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    // TechCore ProBook 15 — RAM/storage variants
    {
      id: 4,
      product_id: 2,
      sku_code: 'TC-PB15-16-512',
      attributes: JSON.stringify({ ram: '16 GB', storage: '512 GB SSD' }),
      price_modifier: 0.00,
      stock_quantity: 25,
      low_stock_threshold: 3,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 5,
      product_id: 2,
      sku_code: 'TC-PB15-32-1TB',
      attributes: JSON.stringify({ ram: '32 GB', storage: '1 TB SSD' }),
      price_modifier: 400.00,
      stock_quantity: 15,
      low_stock_threshold: 3,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    // SoundWave ANC Pro — color variants
    {
      id: 6,
      product_id: 3,
      sku_code: 'SW-ANC-BLK',
      attributes: JSON.stringify({ color: 'Matte Black' }),
      price_modifier: 0.00,
      stock_quantity: 60,
      low_stock_threshold: 10,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 7,
      product_id: 3,
      sku_code: 'SW-ANC-WHT',
      attributes: JSON.stringify({ color: 'Pearl White' }),
      price_modifier: 0.00,
      stock_quantity: 40,
      low_stock_threshold: 10,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    // UrbanThreads Classic Tee — size variants
    {
      id: 8,
      product_id: 4,
      sku_code: 'UT-TEE-S-WHT',
      attributes: JSON.stringify({ size: 'S', color: 'White' }),
      price_modifier: 0.00,
      stock_quantity: 100,
      low_stock_threshold: 15,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 9,
      product_id: 4,
      sku_code: 'UT-TEE-M-WHT',
      attributes: JSON.stringify({ size: 'M', color: 'White' }),
      price_modifier: 0.00,
      stock_quantity: 120,
      low_stock_threshold: 15,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 10,
      product_id: 4,
      sku_code: 'UT-TEE-L-WHT',
      attributes: JSON.stringify({ size: 'L', color: 'White' }),
      price_modifier: 0.00,
      stock_quantity: 90,
      low_stock_threshold: 15,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 11,
      product_id: 4,
      sku_code: 'UT-TEE-XL-WHT',
      attributes: JSON.stringify({ size: 'XL', color: 'White' }),
      price_modifier: 0.00,
      stock_quantity: 70,
      low_stock_threshold: 15,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    // HomeStyle Non-Stick Skillet — single SKU
    {
      id: 12,
      product_id: 5,
      sku_code: 'HS-SKILLET-28',
      attributes: JSON.stringify({ size: '28 cm' }),
      price_modifier: 0.00,
      stock_quantity: 80,
      low_stock_threshold: 10,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
