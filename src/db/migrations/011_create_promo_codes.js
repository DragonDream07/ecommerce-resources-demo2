/**
 * Migration: 011_create_promo_codes
 * Table: promo_codes (with rules JSON column)
 */
exports.up = function (knex) {
  return knex.schema.createTable('promo_codes', (table) => {
    table.increments('id').primary();
    table.string('code', 100).notNullable().unique();
    table.string('discount_type', 50).notNullable().comment('percentage | flat');
    table.decimal('discount_value', 12, 2).notNullable();
    table.decimal('max_discount_amount', 12, 2).nullable();
    table.decimal('min_order_value', 12, 2).nullable();
    table.integer('usage_limit').nullable().comment('NULL means unlimited');
    table.integer('usage_count').notNullable().defaultTo(0);
    table.integer('per_user_limit').nullable();
    table.jsonb('rules').nullable().comment('Additional eligibility rules as JSON');
    table.timestamp('valid_from').notNullable();
    table.timestamp('valid_until').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('promo_codes');
};
