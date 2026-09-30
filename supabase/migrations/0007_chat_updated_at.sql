-- 0007: chat_conversations lacks an `updated_at` column, but the generic
-- trg_<table>_updated trigger (applied to every table in 0001) assigns
-- new.updated_at = now() on UPDATE. Every `update chat_conversations set
-- last_message_at = ...` therefore failed with 42703 ("record new has no
-- field updated_at"), making sendMessage return 500 after the message had
-- already been inserted. Adding the column satisfies the trigger.
alter table chat_conversations add column if not exists updated_at timestamptz not null default now();
