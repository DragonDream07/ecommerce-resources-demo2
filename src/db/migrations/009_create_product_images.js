/**
 * Migration: 009_create_product_images
 * Table: product_images (FK → products)
 */
exports.up = function (knex) {
  return knex.schema.createTable('product_images', (table) => {
    table.increments('id').primary();
    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    table.string('image_url', 500).notNullable();
    table.string('alt_text', 255).nullable();
    table.boolean('is_primary').notNullable().defaultTo(false);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_images');
};
