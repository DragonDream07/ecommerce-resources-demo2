/**
 * Migration: 018_create_payment_attempts
 * Table: payment_attempts (FK → orders)
 */
exports.up = function (knex) {
  return knex.schema.createTable('payment_attempts', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.string('gateway', 100).notNullable().comment('e.g. razorpay, stripe');
    table.string('gateway_order_id', 255).nullable();
    table.string('gateway_payment_id', 255).nullable();
    table.string('status', 50).notNullable().defaultTo('initiated').comment('initiated | success | failed | refunded');
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('INR');
    table.jsonb('gateway_response').nullable();
    table.timestamp('attempted_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payment_attempts');
};
