/**
 * Migration: 022_create_notifications
 * Table: notifications (FK → users, nullable for broadcast)
 */
exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .comment('NULL indicates a broadcast notification');
    table.string('type', 100).notNullable().comment('e.g. order_placed, payment_success, promo');
    table.string('title', 500).notNullable();
    table.text('body').notNullable();
    table.jsonb('data').nullable().comment('Arbitrary payload related to the notification');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamps(true, true);
    table.index('user_id');
    table.index('is_read');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notifications');
};
