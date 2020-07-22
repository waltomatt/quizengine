const db = require('db')

/**
 * @typedef {Object} QuizQuestionAnswer
 * @param {number} id
 * @param {number} question_id - The ID of the question
 * @param {string} answer - The answer text
 * @param {boolean} correct - Is the answer correct?
 */

/** Class representing a question within a quiz */
class QuizQuestion {

  /**
   * Create a QuizQuestion
   * @param {number} id - The ID of an existing question
   */
  constructor (id) {
    this.id = id
  }

  /**
   * Inserts the new question into the database
   */
  async create () {
    const { rows } = await db.query(`
      INSERT INTO "quiz_question" 
          ("quiz_id", "question")
      VALUES ($1, $2)
      RETURNING id
    `, [this.quiz_id, this.question])

    this.id = rows[0].id
  }

  /**
   * Sets the question's text
   * @param {string} text - The question text
   */
  setQuestion (text) {
    this.question = text
  }

  /**
   * Sets the questions's associated quiz
   * @param {Quiz} quiz - The question's associated quiz 
   */
  setQuiz (quiz) {
    this.quiz_id = quiz.id
  }

  /**
   * Gets the list of answers for the question
   * @returns {QuizQuestionAnswer[]} - An array of answers
   */
  async getAnswers () {
    const { rows } = await db.query(`
      SELECT * FROM "quiz_question_answer"
      WHERE "question_id" = $1    
    `, [this.id])

    return rows
  }

  /**
   * Checks if an answer is valid for this question
   * @param {number} answer - The ID of the answer
   * @returns {boolean}
   */
  async isValidAnswer (answer) {
    const { rows } = await db.query(`
      SELECT "id" FROM "quiz_question_answer"
      WHERE "question_id"=$1 AND "id"=$2
    `, [this.id, answer])

    return (rows.length > 0)
  }

  /**
   * Adds an answer to this question
   * @param {string} answer - The answer text
   * @param {boolean} correct 
   */
  async addAnswer (answer, correct) {
    const { rows } = await db.query(`
      INSERT INTO "quiz_question_answer" 
          ("question_id", "answer", "correct")
      VALUES 
          ($1, $2, $3)
      RETURNING id
        
    `, [this.id, answer, correct])

    return rows[0].id
  }

  /**
   * Submits an answer for a given user
   * @param {string} user - The user's email address
   * @param {number} answerId - The ID of the answer
   */
  async doAnswer (user, answerId) {
    await db.query(`
      INSERT INTO "quiz_user_answer" 
          ("email", "question_id", "answer_id")
      VALUES ($1, $2, $3)
  
    `, [user, this.id, answerId])
  }

  /**
   * Returns a QuizQuestion instance for a given database row
   * @param {Object} row 
   * @returns {QuizQuestion}
   */
  static fromRow (row) {
    const question = new QuizQuestion(row.id)
    question.question = row.question
    question.quiz_id = row.quiz_id

    return question
  }
}

module.exports = QuizQuestion
