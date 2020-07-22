const QuizQuestion = require('./QuizQuestion')

/**
 * @typedef {Object} RangeMeanAverage
 * @property {number} count - The absolute number of users scoring in this percentage range
 * @property {number} percentage - The percentage of users scoring in this range
 * @property {number} min - The smallest percent value in this range
 * @property {number} max - The largest percent value in this range
 */

/**
 * @typedef {Object} UserAnswer
 * @property {number} id
 * @property {number} question - The ID of the question
 * @property {number} answer - The ID of the answer
 * @property {boolean} correct
 * @property {string} email - The email address of the user
 */

/** Class representing a Quiz entity */
class Quiz {
  /**
   * Create a quiz instance
   * @param {Object} db - The database object
   * @param {number} id - The ID of an existing quiz
   */
  constructor (db, id) {
    this.db = db
    this.id = id
  }

  /**
   * Inserts a new quiz into the database
   */
  async create () {
    const { rows } = await this.db.query(`
      INSERT INTO "quiz" ("name")
      VALUES($1)
      RETURNING id
    `, [this.name])

    this.id = rows[0].id
  }

  /**
   * Sets the name of the quiz
   * @param {string} name
   */
  async setName (name) {
    this.name = name
  }

  /**
   * Gets all questions related to the quiz
   * @returns {QuizQuestion[]} An array of questions
   */
  async getQuestions () {
    const { rows } = await this.db.query(`
      SELECT *
      FROM "quiz_question" 
      WHERE "quiz_id"=$1
      ORDER BY "id" ASC
    `, [this.id])

    // Map each object from the postgres to an instance of QuizQuestion
    return rows.map(row => QuizQuestion.fromRow(this.db, row))
  }

  /**
   * Gets a list of questions completed by a given user
   * @param {string} user
   */
  async getCompletedQuestions (user) {
    const { rows } = await this.db.query(`
      SELECT q.*, a.answer_id AS answer
      FROM "quiz_user_answer" a, "quiz_question" q 
      WHERE 
          a.question_id=q.id AND 
          a.email=$1 AND
          q.quiz_id=$2
      ORDER BY q.id ASC
    `, [user, this.id])

    return rows.map(row => QuizQuestion.fromRow(this.db, row))
  }

  /**
   * Gets the next question for a given user, or false if all are completed
   * @param {string} user
   * @returns {QuizQuestion|boolean} - The next question (or false for no next question)
   */
  async getNextQuestion (user) {
    const userCompleted = await this.getCompletedQuestions(user)
    const questions = await this.getQuestions()

    if (userCompleted.length === 0) {
      return questions[0]
    }

    const questionIds = questions.map(q => q.id)

    const lastCompletedByUser = userCompleted[userCompleted.length - 1]
    const nextQuestionIndex = questionIds.indexOf(lastCompletedByUser.id) + 1

    return questions[nextQuestionIndex] || false
  }

  /**
   * Deletes the quiz from the database
   */
  async remove () {
    await this.db.query(`
      DELETE FROM "quiz"
      WHERE "id"=$1
    `, [this.id])
  }

  /**
   * Gets the statistics for the quiz, including the answers for each partaking user and percent ranges
   * @returns {{ranges: RangeMeanAverage[], answers: Object.<string, UserAnswer>}} - Returns an object containing an array of RangeMeanAverage's and an object of answers keyed by the user's email address
   */
  async getStatistics () {
    // get all the answers for all the users
    const { rows: answers } = await this.db.query(`
      SELECT 
        q."id",
        q."question",
        qa."answer",
        qa."correct",
        ua."email"

      FROM 
        "quiz_question" q, 
        "quiz_question_answer" qa, 
        "quiz_user_answer" ua

      WHERE 
        ua."question_id" = q."id" AND
        qa."id" = ua."answer_id" AND
        q."quiz_id" = $1

      ORDER BY q."id" ASC
    `, [this.id])

    const numberOfQuestions = (await this.getQuestions()).length

    // group all the answers by user
    const userAnswers = {}

    for (const answer of answers) {
      userAnswers[answer.email] = userAnswers[answer.email] || []
      userAnswers[answer.email].push(answer)
    }

    // now calculate the score for each user
    const userScores = []
    for (const user in userAnswers) {
      // we only want people who have completed the quiz all the way
      if (userAnswers[user].length !== numberOfQuestions) {
        delete userAnswers[user]
        return
      }

      userScores.push(this.calculateScore(userAnswers[user]).percentage)
    }

    // now group them into array of length 10 with each elm representing a 10% range)
    let percentRanges = []
    percentRanges.length = 10
    percentRanges = percentRanges.fill(0, 0, 10)

    for (const score of userScores) {
      const rangeIndex = Math.min(9, Math.floor(score / 10))
      percentRanges[rangeIndex]++
    }

    // now we return the absolute count and percentage for each range along with the complete list of user answers
    return {
      ranges: percentRanges.map((count, index) => {
        return {
          count,
          percentage: Math.round((count / userScores.length) * 100),
          min: index * 10,
          max: (index + 1) * 10
        }
      }),

      userAnswers
    }
  }

  /**
   * Calculates the score as an absolute and a percentage for a given set of answers
   * @param {UserAnswer[]} answers - An array of the user's answers
   * @returns {{count: number, percentage: number}} - An object containing the absolute score and percentage
   */
  calculateScore (answers) {
    // sum the number of correct
    const correct = answers.reduce((correct, ans) => correct + (ans.correct ? 1 : 0), 0)
    // return absolute number & as a percentage
    return {
      count: correct,
      percentage: (correct / answers.length) * 100
    }
  }

  /**
   * Gets result information for a given user
   * @param {string} user - The user's email address
   * @returns {{answers: UserAnswer[], score: number, meanAverage: RangeMeanAverage}} - An object containing the user's answers, score and mean average
   */
  async getResult (user) {
    const stats = await this.getStatistics()
    const answers = stats.userAnswers[user]
    const score = this.calculateScore(answers)

    const rangeIndex = Math.min(9, Math.floor(score.percentage / 10))

    return {
      answers,
      score,
      meanAverage: stats.ranges[rangeIndex]
    }
  }

  /**
   * Gets all quizzes
   * @param {Object} db - The database object
   * @returns {Quiz[]} - An array of quizzes
   */
  static async getAll (db) {
    const { rows } = await this.db.query('SELECT * FROM quiz')
    return rows.map(row => Quiz.fromRow(row))
  }

  /**
   * Converts a row from a database query into a Quiz object
   * @param {Object} db - The database object
   * @param {Object} row
   * @returns {Quiz}
   */
  static async fromRow (db, row) {
    const quiz = new Quiz(db, row.id)
    quiz.setName(row.name)

    return quiz
  }

  /**
   * Verifies that a given quizID exists
   * @param {Object} db - The database object
   * @param {number} id
   * @returns {boolean}
   */
  static async exists (db, id) {
    const { rows } = await db.query('SELECT id FROM quiz WHERE id=$1', [id])
    return (rows.length !== 0)
  }
}

module.exports = Quiz
