/**
 * Migration: 007_create_brands
 * Table: brands
 */
exports.up = function (knex) {
  return knex.schema.createTable('brands', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.string('slug', 255).notNullable().unique();
    table.text('description').nullable();
    table.string('logo_url', 500).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('brands');
};
