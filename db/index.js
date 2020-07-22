const { Client } = require('pg')
const client = new Client()

const init = async () => {
  // credentials are pulled from environment variables: PGHOST, PGUSER, PGDATABASE, PGPASSWORD
  await client.connect()
}

const query = async (text, values) => {
  const res = await client.query(text, values)
  if (res) {
    return res
  } else {
    return false
  }
}

module.exports = {
  init,
  query
}