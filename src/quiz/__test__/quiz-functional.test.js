const request = require('supertest')
const app = require('../../app')
const db = require('db')
const Quiz = require('quiz/Quiz')
const QuizQuestion = require('../QuizQuestion')

let testQuiz, testQuestion, correctAnswerId, incorrectAnswerId

beforeAll(async () => {
  await db.init()
  // populate db with a test quiz
  testQuiz = new Quiz(db)
  testQuiz.setName('test')
  await testQuiz.create()

  testQuestion = new QuizQuestion(db)
  testQuestion.setQuiz(testQuiz)
  testQuestion.setQuestion('test question')
  await testQuestion.create()

  correctAnswerId = await testQuestion.addAnswer('answer a', true)
  incorrectAnswerId = await testQuestion.addAnswer('answer b', false)
  testQuestion.addAnswer('answer c', false)
  testQuestion.addAnswer('answer d', false)
})

afterAll(async () => {
  await testQuiz.remove()
  db.close()
})

describe('GET /quiz', () => {
  test('Should respond HTTP 200', () => {
    return request(app)
        .get('/quiz')
        .then(res => {
            expect(res.statusCode).toBe(200)
        })
  })
})
const agent = request.agent(app)
const incorrectAgent = request.agent(app)

describe('Submitting quiz question with correct answer', () => {
  test('Requesting quiz without email should redirect to /quiz/email', () => {
    return agent
      .get('/quiz/' + testQuiz.id)
      .then(res => {
        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toBe('/quiz/email')
      })
  })


  test('Submitting an invalid email to /quiz/email should redirect back to /quiz/email', () => {
    return agent
      .post('/quiz/email')
      .send('email=test')
      .then(res => {
        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toBe('/quiz/email')
      })
  })

  test('Submitting a valid email should redirect back to the quiz', () => {
    return agent
      .post('/quiz/email')
      .send('email=test@test.com')
      .then(res => {
        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toBe('/quiz/' + testQuiz.id)
      })
  })

  test('Quiz is displayed with first question & set of answers', () => {
    return agent
      .get('/quiz/' + testQuiz.id)
      .then(res => {
        expect(res.statusCode).toBe(200)
        expect(res.text).toContain('<h2>test question</h2>')
        expect(res.text).toContain('answer a')
        expect(res.text).toContain('answer b')
        expect(res.text).toContain('answer c')
        expect(res.text).toContain('answer d')
      })
  })

  test('Submitting invalid answer', () => {
    return agent
      .post('/quiz/submit')
      .send({
        quiz: testQuiz.id,
        answer: (correctAnswerId*10)
      })
      .then(res => {
        expect(res.statusCode).toBe(404)
      })
  })

  test('Submitting quiz answer correctly', () => {
    return agent
      .post('/quiz/submit')
      .send({
        quiz: testQuiz.id,
        answer: correctAnswerId
      })
      .then(res => {
        expect(res.statusCode).toBe(302)
      })
  })

  test('Quiz is completed, correct percentage & banding', () => {
    return agent
      .get('/quiz/' + testQuiz.id)
      .then(res => {
        expect(res.statusCode).toBe(200)
        expect(res.text).toContain('Quiz completed!')
        expect(res.text).toContain('1/1 (100%)')
        expect(res.text).toContain('<strong>100%</strong> of people')
        expect(res.text).toContain('90-100%')
      })
  })

  test('Attempt to submit quiz answer again', () => {
    return agent
      .post('/quiz/submit')
      .send({
        quiz: testQuiz.id,
        answer: correctAnswerId
      })
      .then(res => {
        expect(res.statusCode).toBe(403)
      })
  })
})

describe('Submitting quiz with incorrect answer as another user', () => {
  beforeAll(async () => {
    await incorrectAgent.post('/quiz/email')
    .send('email=test2@test.com')
  })
    
  test('Submitting incorrect answer as another user', () => {
    return incorrectAgent
      .post('/quiz/submit')
      .send({
        quiz: testQuiz.id,
        answer: incorrectAnswerId
      })
      .then(res => {
        expect(res.statusCode).toBe(302)
      })
  })

  test('Incorrect answer yields 0% score and correct banding', () => {
    return incorrectAgent
      .get('/quiz/' + testQuiz.id)
      .then(res => {
        expect(res.statusCode).toBe(200)
        expect(res.text).toContain('Quiz completed!')
        expect(res.text).toContain('0/1 (0%)')
        expect(res.text).toContain('<strong>50%</strong> of people')
        expect(res.text).toContain('0-10%')
      })
  })
})