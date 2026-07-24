/**
 * Migration: 006_create_categories
 * Table: categories (self-referencing parent_id)
 */
exports.up = function (knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table
      .integer('parent_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description').nullable();
    table.string('image_url', 500).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('categories');
};
