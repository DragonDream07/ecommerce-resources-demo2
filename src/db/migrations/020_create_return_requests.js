/**
 * Migration: 020_create_return_requests
 * Table: return_requests (FK → orders)
 */
exports.up = function (knex) {
  return knex.schema.createTable('return_requests', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.string('status', 50).notNullable().defaultTo('requested').comment('requested | approved | rejected | completed');
    table.text('reason').notNullable();
    table.text('resolution').nullable();
    table.jsonb('item_details').nullable().comment('Array of {sku_id, quantity} requested for return');
    table.integer('reviewed_by').unsigned().nullable().comment('user_id of admin who reviewed');
    table.timestamp('reviewed_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('return_requests');
};
