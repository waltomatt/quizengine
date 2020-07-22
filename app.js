const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(session({
  secret: 'not a very good secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use('/quiz', require('quiz/router'))

module.exports = app
