/**
 * Seed: Default roles
 */
exports.seed = async function (knex) {
  await knex('roles').del();

  await knex('roles').insert([
    {
      id: 1,
      name: 'customer',
      description: 'Regular customer with shopping access',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'staff',
      description: 'Staff member with order management access',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      name: 'admin',
      description: 'Administrator with full system access',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
