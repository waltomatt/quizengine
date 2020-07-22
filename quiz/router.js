const express = require('express')
const Quiz = require('./Quiz')
const db = require('db')
const { isEmail } = require('validator')

const router = express.Router()

router.get('/', async (req, res) => {
  const quizzes = await Quiz.getAll(db)

  res.render('quiz/index', {
    quizzes
  })
})

/**
 * Middleware for checking that a user has authenticated with their email
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const isEmailProvided = (req, res, next) => {
  if (req.session.email) {
    next()
  } else {
    req.session.return = req.originalUrl
    res.redirect('/quiz/email')
  }
}

router.get('/email', async (req, res) => {
  res.render('quiz/email')
})

router.post('/email', async (req, res) => {
  const email = (req.body.email || '').toString()

  if (isEmail(email)) {
    req.session.email = email
    const returnUrl = req.session.return
    req.session.return = null

    res.redirect(returnUrl || '/')
  } else {
    res.redirect('/quiz/email')
  }
})

router.get('/:quizID', isEmailProvided, async (req, res) => {
  const quizID = parseInt(req.params.quizID)

  if (quizID) {
    if (!await Quiz.exists(db, quizID)) {
      return res.status(404).end()
    }

    const quiz = new Quiz(db, quizID)
    const nextQuestion = await quiz.getNextQuestion(req.session.email)

    if (nextQuestion) {
      const answers = await nextQuestion.getAnswers()

      res.render('quiz/question', {
        question: nextQuestion,
        answers,
        quiz: quizID
      })
    } else {
      // if no next question, user has completed this quiz

      const result = await quiz.getResult(req.session.email)
      res.render('quiz/completed', {
        result: result
      })
    }
  } else {
    res.status(404).end()
  }
})

router.post('/submit', isEmailProvided, async (req, res) => {
  const quizID = parseInt(req.body.quiz)
  const answerID = parseInt(req.body.answer)

  if (quizID && answerID) {
    if (!await Quiz.exists(db, quizID)) {
      return res.status(404)
    }

    const quiz = new Quiz(db, quizID)
    const currentQuestion = await quiz.getNextQuestion(req.session.email)

    // don't want them completing the question again
    if (currentQuestion === false) {
      return res.status(403).end()
    }

    if (await currentQuestion.isValidAnswer(answerID)) {
      currentQuestion.doAnswer(req.session.email, answerID)
      res.redirect('/quiz/' + quiz.id)
    } else {
      res.status(404).end()
    }
  } else {
    res.status(400).end()
  }
})

module.exports = router
