-- Migration: 20261112010000_onboarding_command_receipts
-- Purpose: Update command_receipts CHECK constraint to include COMPLETE_ONBOARDING and UPDATE_LEARNING_PLAN.
-- Additive only: preserves all existing command types, adds new onboarding commands.

BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "app_private"."command_receipts"
  DROP CONSTRAINT "command_receipts_command_check";

ALTER TABLE "app_private"."command_receipts"
  ADD CONSTRAINT "command_receipts_command_check" CHECK ("command" IN (
    'PUBLISH_LESSON',
    'PUBLISH_ASSESSMENT',
    'DISABLE_ACCOUNT',
    'ENABLE_ACCOUNT',
    'COMPLETE_LESSON',
    'SELECT_START',
    'ASSIGN_TEACHER',
    'SUBMIT_CONTENT',
    'REMOVE_DRAFT_MEMBER',
    'REQUEST_CHANGES',
    'APPROVE',
    'ARCHIVE',
    'WITHDRAW',
    'COMPLETE_ONBOARDING',
    'UPDATE_LEARNING_PLAN'
  ));

COMMIT;
