#!/bin/bash
# Usage: ./scripts/report.sh <email address>
# Runs a report on the docker instance of the quizengine and passes to mail which sends to the specified address
    
docker-compose exec quizengine node report | mail -s "Quizengine report" $1