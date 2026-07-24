/**
 * Migration: 003_create_user_roles
 * Table: user_roles (join table)
 */
exports.up = function (knex) {
  return knex.schema.createTable('user_roles', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('role_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['user_id', 'role_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_roles');
};
