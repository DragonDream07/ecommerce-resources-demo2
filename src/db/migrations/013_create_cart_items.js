/**
 * Migration: 013_create_cart_items
 * Table: cart_items (FK → carts, skus)
 */
exports.up = function (knex) {
  return knex.schema.createTable('cart_items', (table) => {
    table.increments('id').primary();
    table
      .integer('cart_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('carts')
      .onDelete('CASCADE');
    table
      .integer('sku_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('skus')
      .onDelete('CASCADE');
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('unit_price', 12, 2).notNullable().comment('Snapshot of price at time of adding');
    table.timestamps(true, true);
    table.unique(['cart_id', 'sku_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cart_items');
};
