/**
 * Migration: 001_create_roles
 * Table: roles
 */
exports.up = function (knex) {
  return knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('roles');
};
