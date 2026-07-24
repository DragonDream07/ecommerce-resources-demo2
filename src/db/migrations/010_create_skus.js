/**
 * Migration: 010_create_skus
 * Table: skus (FK → products, with size/colour/stock columns)
 */
exports.up = function (knex) {
  return knex.schema.createTable('skus', (table) => {
    table.increments('id').primary();
    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    table.string('sku_code', 100).notNullable().unique();
    table.string('size', 50).nullable();
    table.string('colour', 100).nullable();
    table.integer('stock_quantity').notNullable().defaultTo(0);
    table.integer('reserved_quantity').notNullable().defaultTo(0);
    table.decimal('price_override', 12, 2).nullable().comment('Override product selling_price if set');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('skus');
};
