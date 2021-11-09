
exports.up = function(knex) {
  return knex.schema
    .createTable('user', function (table) {
      table.increments('id').primary();
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user');
};
