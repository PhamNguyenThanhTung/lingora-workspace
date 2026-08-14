-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEARNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Cefr" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('MCQ', 'FILL_BLANK', 'REORDER');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'AI');

-- CreateTable
CREATE TABLE "languages" (
    "code" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "native_name" TEXT NOT NULL,
    "is_learnable" BOOLEAN NOT NULL DEFAULT false,
    "is_ui_locale" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'LEARNER',
    "ui_locale" VARCHAR(8) NOT NULL DEFAULT 'vi',
    "native_lang_code" VARCHAR(8) NOT NULL DEFAULT 'vi',
    "daily_goal_min" INTEGER NOT NULL DEFAULT 15,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "last_qualifying_activity_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_daily_goal_min_check" CHECK ("daily_goal_min" >= 0),
    CONSTRAINT "profiles_streak_count_check" CHECK ("streak_count" >= 0)
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "language_code" VARCHAR(8) NOT NULL,
    "cefr" "Cefr" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "courses_order_index_check" CHECK ("order_index" >= 0)
);

-- CreateTable
CREATE TABLE "course_translations" (
    "course_id" UUID NOT NULL,
    "locale" VARCHAR(8) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "course_translations_pkey" PRIMARY KEY ("course_id","locale")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lessons_order_index_check" CHECK ("order_index" >= 0)
);

-- CreateTable
CREATE TABLE "lesson_translations" (
    "lesson_id" UUID NOT NULL,
    "locale" VARCHAR(8) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "lesson_translations_pkey" PRIMARY KEY ("lesson_id","locale")
);

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" UUID NOT NULL,
    "language_code" VARCHAR(8) NOT NULL,
    "term" TEXT NOT NULL,
    "normalized_term" TEXT NOT NULL,
    "phonetic" TEXT,
    "audio_url" TEXT,
    "cefr" "Cefr",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_translations" (
    "vocabulary_id" UUID NOT NULL,
    "locale" VARCHAR(8) NOT NULL,
    "meaning" TEXT NOT NULL,
    "example" TEXT,

    CONSTRAINT "vocabulary_translations_pkey" PRIMARY KEY ("vocabulary_id","locale")
);

-- CreateTable
CREATE TABLE "lesson_vocabulary" (
    "lesson_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "lesson_vocabulary_pkey" PRIMARY KEY ("lesson_id","vocabulary_id"),
    CONSTRAINT "lesson_vocabulary_order_index_check" CHECK ("order_index" >= 0)
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "payload" JSONB NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exercises_order_index_check" CHECK ("order_index" >= 0),
    CONSTRAINT "exercises_payload_object_check" CHECK (jsonb_typeof("payload") = 'object'),
    CONSTRAINT "exercises_payload_version_check" CHECK (("payload" ->> 'payloadVersion') = '1')
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_progress_score_check" CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100))
);

-- CreateTable
CREATE TABLE "user_vocab_srs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval_days" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "recall_probability" DOUBLE PRECISION,
    "next_review_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reviewed_at" TIMESTAMP(3),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "lapse_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_vocab_srs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_vocab_srs_ease_factor_check" CHECK ("ease_factor" > 0),
    CONSTRAINT "user_vocab_srs_interval_days_check" CHECK ("interval_days" >= 0),
    CONSTRAINT "user_vocab_srs_recall_probability_check" CHECK ("recall_probability" IS NULL OR ("recall_probability" >= 0 AND "recall_probability" <= 1)),
    CONSTRAINT "user_vocab_srs_review_count_check" CHECK ("review_count" >= 0),
    CONSTRAINT "user_vocab_srs_lapse_count_check" CHECK ("lapse_count" >= 0)
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" UUID NOT NULL,
    "srs_card_id" UUID NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "interval_days" DOUBLE PRECISION NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_logs_interval_days_check" CHECK ("interval_days" >= 0)
);

-- CreateTable
CREATE TABLE "chat_scenarios" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "system_prompt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_scenario_translations" (
    "scenario_id" UUID NOT NULL,
    "ui_locale" VARCHAR(8) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "chat_scenario_translations_pkey" PRIMARY KEY ("scenario_id","ui_locale")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scenario_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_messages_sequence_number_check" CHECK ("sequence_number" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "courses_language_code_order_index_idx" ON "courses"("language_code", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_course_id_order_index_key" ON "lessons"("course_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "vocabularies_language_code_normalized_term_key" ON "vocabularies"("language_code", "normalized_term");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_vocabulary_lesson_id_order_index_key" ON "lesson_vocabulary"("lesson_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_lesson_id_order_index_key" ON "exercises"("lesson_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_lesson_id_key" ON "user_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "user_vocab_srs_user_id_next_review_at_idx" ON "user_vocab_srs"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocab_srs_user_id_vocabulary_id_key" ON "user_vocab_srs"("user_id", "vocabulary_id");

-- CreateIndex
CREATE INDEX "review_logs_srs_card_id_reviewed_at_idx" ON "review_logs"("srs_card_id", "reviewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_scenarios_code_key" ON "chat_scenarios"("code");

-- CreateIndex
CREATE INDEX "chat_sessions_user_id_updated_at_idx" ON "chat_sessions"("user_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_session_id_sequence_number_key" ON "chat_messages"("session_id", "sequence_number");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_ui_locale_fkey" FOREIGN KEY ("ui_locale") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_native_lang_code_fkey" FOREIGN KEY ("native_lang_code") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_translations" ADD CONSTRAINT "course_translations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_translations" ADD CONSTRAINT "course_translations_locale_fkey" FOREIGN KEY ("locale") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_translations" ADD CONSTRAINT "lesson_translations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_translations" ADD CONSTRAINT "lesson_translations_locale_fkey" FOREIGN KEY ("locale") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_translations" ADD CONSTRAINT "vocabulary_translations_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_translations" ADD CONSTRAINT "vocabulary_translations_locale_fkey" FOREIGN KEY ("locale") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_vocabulary" ADD CONSTRAINT "lesson_vocabulary_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_vocabulary" ADD CONSTRAINT "lesson_vocabulary_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocab_srs" ADD CONSTRAINT "user_vocab_srs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocab_srs" ADD CONSTRAINT "user_vocab_srs_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_srs_card_id_fkey" FOREIGN KEY ("srs_card_id") REFERENCES "user_vocab_srs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_scenario_translations" ADD CONSTRAINT "chat_scenario_translations_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "chat_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_scenario_translations" ADD CONSTRAINT "chat_scenario_translations_ui_locale_fkey" FOREIGN KEY ("ui_locale") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "chat_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
