/**
 * Migration: 012_create_carts
 * Table: carts (nullable user_id for guest, session_id)
 */
exports.up = function (knex) {
  return knex.schema.createTable('carts', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('session_id', 255).nullable().comment('Session identifier for guest carts');
    table
      .integer('promo_code_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('promo_codes')
      .onDelete('SET NULL');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.index('session_id');
    table.index('user_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('carts');
};
