/*
    quizengine
    by Matt Walton
    github.com/waltomatt/quizengine

    index.js -  server entry point
*/

const app = require('./app')
const db = require('db')

db.init()
app.listen(8080, () => {
  console.log('Web server listening on port 8080')
})
