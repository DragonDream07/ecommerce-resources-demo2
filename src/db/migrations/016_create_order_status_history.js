/**
 * Migration: 016_create_order_status_history
 * Table: order_status_history (FK → orders)
 */
exports.up = function (knex) {
  return knex.schema.createTable('order_status_history', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.string('status', 50).notNullable();
    table.text('comment').nullable();
    table.integer('changed_by').unsigned().nullable().comment('user_id of actor');
    table.timestamp('changed_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_status_history');
};
