const db = require('db')
const Quiz = require('./quiz/Quiz')

const generateReport = async () => {
  await db.init()
  const quizzes = await Quiz.getAll(db)

  for (const quiz of quizzes) {
    const quizReport = await quiz.getStatistics()
    console.log('-------------------------------')
    console.log()
    console.log(quiz.name)
    console.log()
    console.log('Completed by')
    for (const email in quizReport.userAnswers) {
      console.log(`\t${email} (${quiz.calculateScore(quizReport.userAnswers[email]).percentage}%)`)
    }
    console.log()
    console.log('Percent ranges')

    for (const range of quizReport.ranges) {
      console.log(`\t${range.min}% - ${range.max}% : ${range.count}`)
    }
    console.log()
  }
}

generateReport()
