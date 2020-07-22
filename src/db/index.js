const { Client } = require('pg')
const client = new Client({
  host: 'db',
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: 'quizengine'
})

/** Performs a Postgres database connection */
const init = async () => {
  await client.connect()
}

/** Wraps a postgres query */
const query = async (text, values) => {
  return await client.query(text, values)
}

/** Closes the database connection */
const close = async () => {
  await client.end()
}

module.exports = {
  init,
  query,
  close
}
