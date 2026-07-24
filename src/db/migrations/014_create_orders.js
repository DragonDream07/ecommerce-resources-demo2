/**
 * Migration: 014_create_orders
 * Table: orders (FK → users nullable, addresses)
 */
exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 100).notNullable().unique();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('shipping_address_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('addresses')
      .onDelete('RESTRICT');
    table
      .integer('billing_address_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('addresses')
      .onDelete('RESTRICT');
    table
      .integer('promo_code_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('promo_codes')
      .onDelete('SET NULL');
    table.string('status', 50).notNullable().defaultTo('pending');
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('shipping_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable();
    table.string('payment_status', 50).notNullable().defaultTo('unpaid');
    table.string('payment_method', 100).nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('orders');
};
