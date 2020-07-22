#!/bin/bash
docker-compose build
docker-compose up --no-start
docker-compose start postgresdb
docker-compose exec -T postgresdb psql -U postgres < quizengine.sql
docker-compose start quizengine