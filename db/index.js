const { Client } = require('pg')
const client = new Client()

/** Performs a Postgres database connection */
const init = async () => {
  // credentials are pulled from environment variables: PGHOST, PGUSER, PGDATABASE, PGPASSWORD
  await client.connect()
}

/** Wraps a postgres query */
const query = async (text, values) => {
 return await client.query(text, values)
}

module.exports = {
  init,
  query
}
