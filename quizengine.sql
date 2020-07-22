-- Adminer 4.7.7 PostgreSQL dump


CREATE DATABASE "quizengine";

\connect "quizengine";

DROP TABLE IF EXISTS "quiz";
DROP SEQUENCE IF EXISTS quiz_id_seq;
CREATE SEQUENCE quiz_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;

CREATE TABLE "public"."quiz" (
    "id" integer DEFAULT nextval('quiz_id_seq') NOT NULL,
    "name" character varying NOT NULL,
    CONSTRAINT "quiz_id" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "quiz_question";
DROP SEQUENCE IF EXISTS quiz_questions_id_seq;
CREATE SEQUENCE quiz_questions_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;

CREATE TABLE "public"."quiz_question" (
    "id" integer DEFAULT nextval('quiz_questions_id_seq') NOT NULL,
    "quiz_id" integer NOT NULL,
    "question" character varying NOT NULL,
    CONSTRAINT "quiz_questions_id" PRIMARY KEY ("id"),
    CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE NOT DEFERRABLE
) WITH (oids = false);


DROP TABLE IF EXISTS "quiz_question_answer";
DROP SEQUENCE IF EXISTS quiz_question_answer_id_seq;
CREATE SEQUENCE quiz_question_answer_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;

CREATE TABLE "public"."quiz_question_answer" (
    "id" integer DEFAULT nextval('quiz_question_answer_id_seq') NOT NULL,
    "question_id" integer NOT NULL,
    "answer" character varying NOT NULL,
    "correct" boolean NOT NULL,
    CONSTRAINT "quiz_question_answer_id" PRIMARY KEY ("id"),
    CONSTRAINT "quiz_question_answer_question_id_fkey" FOREIGN KEY (question_id) REFERENCES quiz_question(id) ON DELETE CASCADE NOT DEFERRABLE
) WITH (oids = false);


DROP TABLE IF EXISTS "quiz_user_answer";
CREATE TABLE "public"."quiz_user_answer" (
    "email" character varying NOT NULL,
    "question_id" integer NOT NULL,
    "answer_id" integer NOT NULL,
    CONSTRAINT "quiz_user_answer_email_question_id" PRIMARY KEY ("email", "question_id"),
    CONSTRAINT "quiz_user_answer_answer_id_fkey" FOREIGN KEY (answer_id) REFERENCES quiz_question_answer(id) ON DELETE CASCADE NOT DEFERRABLE,
    CONSTRAINT "quiz_user_answer_question_id_fkey" FOREIGN KEY (question_id) REFERENCES quiz_question(id) ON DELETE CASCADE NOT DEFERRABLE
) WITH (oids = false);


-- 2020-07-22 14:49:27.463468+00