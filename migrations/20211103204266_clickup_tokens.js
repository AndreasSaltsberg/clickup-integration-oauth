
exports.up = function(knex) {
  return knex.schema
    .createTable('clickup_tokens', function (table) {
      table.integer('user_id').primary().notNullable();
      table.string('access_token', 255).notNullable();
      table.integer('local_id').unsigned().references('id').inTable('user').notNull().onDelete('cascade');
    })

};

exports.down = function(knex) {
  return knex.schema.dropTable('clickup_tokens');
};
