/**
 * Migration: 002_create_users
 * Table: users
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name', 150).notNullable();
    table.string('last_name', 150).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20).nullable();
    table.string('password_hash', 255).notNullable().comment('bcrypt hash');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_email_verified').notNullable().defaultTo(false);
    table.timestamp('email_verified_at').nullable();
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
