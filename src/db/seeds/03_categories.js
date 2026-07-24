/**
 * Seed: Sample category tree
 */
exports.seed = async function (knex) {
  await knex('categories').del();

  // Root categories
  await knex('categories').insert([
    {
      id: 1,
      parent_id: null,
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      image_url: null,
      is_active: true,
      sort_order: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      parent_id: null,
      name: 'Clothing',
      slug: 'clothing',
      description: 'Apparel for men, women and children',
      image_url: null,
      is_active: true,
      sort_order: 2,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      parent_id: null,
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Products for home and kitchen',
      image_url: null,
      is_active: true,
      sort_order: 3,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Child categories — Electronics
  await knex('categories').insert([
    {
      id: 4,
      parent_id: 1,
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and smartphones',
      image_url: null,
      is_active: true,
      sort_order: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 5,
      parent_id: 1,
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptops and notebook computers',
      image_url: null,
      is_active: true,
      sort_order: 2,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 6,
      parent_id: 1,
      name: 'Audio',
      slug: 'audio',
      description: 'Headphones, speakers and audio gear',
      image_url: null,
      is_active: true,
      sort_order: 3,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Child categories — Clothing
  await knex('categories').insert([
    {
      id: 7,
      parent_id: 2,
      name: "Men's Clothing",
      slug: 'mens-clothing',
      description: "Clothing and apparel for men",
      image_url: null,
      is_active: true,
      sort_order: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 8,
      parent_id: 2,
      name: "Women's Clothing",
      slug: 'womens-clothing',
      description: "Clothing and apparel for women",
      image_url: null,
      is_active: true,
      sort_order: 2,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  // Child categories — Home & Kitchen
  await knex('categories').insert([
    {
      id: 9,
      parent_id: 3,
      name: 'Cookware',
      slug: 'cookware',
      description: 'Pots, pans and cooking equipment',
      image_url: null,
      is_active: true,
      sort_order: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 10,
      parent_id: 3,
      name: 'Furniture',
      slug: 'furniture',
      description: 'Home and office furniture',
      image_url: null,
      is_active: true,
      sort_order: 2,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
