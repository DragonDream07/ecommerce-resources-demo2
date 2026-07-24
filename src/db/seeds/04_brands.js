/**
 * Seed: Sample brands
 */
exports.seed = async function (knex) {
  await knex('brands').del();

  await knex('brands').insert([
    {
      id: 1,
      name: 'TechCore',
      slug: 'techcore',
      description: 'Leading manufacturer of consumer electronics',
      logo_url: null,
      website_url: 'https://techcore.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'UrbanThreads',
      slug: 'urban-threads',
      description: 'Contemporary urban fashion brand',
      logo_url: null,
      website_url: 'https://urbanthreads.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      name: 'SoundWave',
      slug: 'soundwave',
      description: 'Premium audio equipment manufacturer',
      logo_url: null,
      website_url: 'https://soundwave.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 4,
      name: 'HomeStyle',
      slug: 'homestyle',
      description: 'Modern home goods and kitchen essentials',
      logo_url: null,
      website_url: 'https://homestyle.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 5,
      name: 'NovaMobile',
      slug: 'nova-mobile',
      description: 'Innovative smartphone and mobile accessories brand',
      logo_url: null,
      website_url: 'https://novamobile.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
