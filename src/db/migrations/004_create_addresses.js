/**
 * Migration: 004_create_addresses
 * Table: addresses (FK → users)
 */
exports.up = function (knex) {
  return knex.schema.createTable('addresses', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('label', 100).nullable().comment('e.g. Home, Work');
    table.string('full_name', 255).notNullable();
    table.string('phone', 20).notNullable();
    table.text('line1').notNullable();
    table.text('line2').nullable();
    table.string('city', 150).notNullable();
    table.string('state', 150).notNullable();
    table.string('country', 100).notNullable().defaultTo('India');
    table.string('pin_code', 20).notNullable();
    table.boolean('is_default').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('addresses');
};
