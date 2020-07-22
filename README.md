# quizengine
A basic quiz engine using [NodeJS](https://nodejs.org), [ExpressJS](https://expressjs.com) & Postgres.
Includes some basic functional tests with [Jest](https://jestjs.io).
Project is dockerised so requires docker and docker-compose to run!

### Plan

![Basic ER diagram](https://github.com/waltomatt/quizengine/blob/master/plan/whiteboard-er.jpg?raw=true)
![Some pseudocode for algorithms](https://github.com/waltomatt/quizengine/blob/master/plan/pseudo.jpg?raw=true)

### Testing
Some functional tests are present although due to time constraints I didn't create unit tests for the class functions. Also uses [standard](https://standardjs.com/) to check code style.

```
$ npm install -D
$ npm test
```

### Environment variables

```
ADMIN_PASSWORD # the password for the admin portal
POSTGRES_PASSWORD
SESSION_SECRET
```

### First time running (creates database tables)
```
$ ./setup.sh
```