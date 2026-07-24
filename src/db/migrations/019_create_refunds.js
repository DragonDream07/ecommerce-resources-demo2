/**
 * Migration: 019_create_refunds
 * Table: refunds (FK → orders, payment_attempts)
 */
exports.up = function (knex) {
  return knex.schema.createTable('refunds', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table
      .integer('payment_attempt_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('payment_attempts')
      .onDelete('RESTRICT');
    table.decimal('amount', 12, 2).notNullable();
    table.string('status', 50).notNullable().defaultTo('pending').comment('pending | processed | failed');
    table.string('gateway_refund_id', 255).nullable();
    table.text('reason').nullable();
    table.jsonb('gateway_response').nullable();
    table.timestamp('processed_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('refunds');
};
