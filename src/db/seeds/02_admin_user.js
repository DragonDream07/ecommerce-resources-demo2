/**
 * Seed: Default admin user for development
 */
const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
  await knex('user_roles').where({ user_id: 1 }).del();
  await knex('users').where({ id: 1 }).del();

  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  await knex('users').insert([
    {
      id: 1,
      email: 'admin@example.com',
      password_hash: passwordHash,
      first_name: 'System',
      last_name: 'Admin',
      phone: null,
      is_active: true,
      email_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  await knex('user_roles').insert([
    {
      user_id: 1,
      role_id: 3, // admin
      created_at: knex.fn.now(),
    },
  ]);
};
