module.exports = {
  client: 'mysql2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : '',
    password : '',
    database : 'clickup_integration'
  },
  migrations: {
    directory: './migrations',
  },
}
