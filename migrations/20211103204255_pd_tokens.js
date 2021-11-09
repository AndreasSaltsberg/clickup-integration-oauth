
exports.up = function(knex) {
  return knex.schema
    .createTable('pd_tokens', function (table) {
      table.integer('user_id').notNullable();
      table.integer('company_id').notNullable();
      table.string('access_token', 255).notNullable();
      table.string('refresh_token', 255).notNullable();
      table.string('api_domain', 255).notNullable();
      table.string('scope', 255).notNullable();
      table.datetime('expires_in').defaultTo(knex.fn.now())
      table.integer('local_id').unsigned().references('id').inTable('user').notNull().onDelete('cascade');

      table.primary(['user_id', 'company_id']);
    })

};

exports.down = function(knex) {
  return knex.schema.dropTable('pd_tokens');
};
