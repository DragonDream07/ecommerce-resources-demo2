/**
 * Migration: 008_create_products
 * Table: products (FK → categories, brands)
 */
exports.up = function (knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');
    table
      .integer('brand_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('brands')
      .onDelete('SET NULL');
    table.string('name', 500).notNullable();
    table.string('slug', 500).notNullable().unique();
    table.text('description').nullable();
    table.text('short_description').nullable();
    table.decimal('base_price', 12, 2).notNullable();
    table.decimal('selling_price', 12, 2).notNullable();
    table.decimal('tax_rate', 5, 2).notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.jsonb('tags').nullable();
    table.jsonb('meta').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('products');
};
