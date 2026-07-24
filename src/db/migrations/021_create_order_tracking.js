/**
 * Migration: 021_create_order_tracking
 * Table: order_tracking (FK → orders)
 */
exports.up = function (knex) {
  return knex.schema.createTable('order_tracking', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.string('courier_name', 255).nullable();
    table.string('tracking_number', 255).nullable();
    table.string('tracking_url', 500).nullable();
    table.string('current_status', 100).nullable();
    table.jsonb('tracking_events').nullable().comment('Array of {timestamp, location, description}');
    table.timestamp('estimated_delivery_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_tracking');
};
