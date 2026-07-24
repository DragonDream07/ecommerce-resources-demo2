/**
 * Migration: 005_create_serviceable_pin_codes
 * Table: serviceable_pin_codes (lookup)
 */
exports.up = function (knex) {
  return knex.schema.createTable('serviceable_pin_codes', (table) => {
    table.increments('id').primary();
    table.string('pin_code', 20).notNullable().unique();
    table.string('city', 150).nullable();
    table.string('state', 150).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('serviceable_pin_codes');
};
