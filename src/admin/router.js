const express = require('express')
const db = require('db')
const Quiz = require('quiz/Quiz')
const QuizQuestion = require('quiz/QuizQuestion')

const router = express.Router()

router.use(express.json())

/**
 * Middleware for checking that a user has authenticated with the password
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.authenticated) {
    next()
  } else {
    return res.redirect('/admin/auth')
  }
}

router.get('/auth', (req, res) => {
  res.render('admin/password')
})

router.post('/auth', (req, res) => {
  const password = (req.body.password || '').toString()

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true
    res.redirect('/admin')
  } else {
    res.redirect('/admin/auth')
  }
})

router.get('/', isAuthenticated, async (req, res) => {
  const quizzes = await Quiz.getAll(db)
  res.render('admin/index', {
    quizzes: quizzes
  })
})

router.get('/add', isAuthenticated, (req, res) => {
  res.render('admin/add')
})

router.post('/add', isAuthenticated, async (req, res) => {
  const newQuizData = req.body
  // todo: validate (not as important because it's an admin thing)

  const newQuiz = new Quiz(db)
  newQuiz.setName(newQuizData.name)
  await newQuiz.create()

  for (const question of newQuizData.questions) {
    const newQuestion = new QuizQuestion(db)
    newQuestion.setQuiz(newQuiz)
    newQuestion.setQuestion(question.question)
    await newQuestion.create()
    // add each of the answers
    for (let i = 0; i < 4; i++) {
      await newQuestion.addAnswer(question.answers[i], i === parseInt(question.correct))
    }
  }

  res.status(200).end()
})

router.post('/delete', isAuthenticated, async (req, res) => {
  const quizId = parseInt(req.body.quiz)

  if (quizId && Quiz.exists(db, quizId)) {
    const quiz = new Quiz(db, quizId)
    await quiz.remove()

    res.redirect('/admin')
  } else {
    res.status(404).end()
  }
})

router.get('/user', isAuthenticated, async (req, res) => {
  const email = (req.query.email || '').toString().toLowerCase()

  if (email) {
    const quizzes = await Quiz.getUserQuizzes(db, email)
    res.render('admin/user', { email: email, quizzes })
  } else {
    res.status(400).send()
  }
})

module.exports = router
