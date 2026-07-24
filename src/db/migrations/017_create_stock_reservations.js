/**
 * Migration: 017_create_stock_reservations
 * Table: stock_reservations (FK → skus, orders)
 */
exports.up = function (knex) {
  return knex.schema.createTable('stock_reservations', (table) => {
    table.increments('id').primary();
    table
      .integer('sku_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('skus')
      .onDelete('CASCADE');
    table
      .integer('order_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('orders')
      .onDelete('SET NULL');
    table.integer('quantity').notNullable();
    table.string('status', 50).notNullable().defaultTo('reserved').comment('reserved | released | confirmed');
    table.timestamp('expires_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_reservations');
};
