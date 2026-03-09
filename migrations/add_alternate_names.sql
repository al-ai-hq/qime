-- Add alternate_names column to organizations and competitors tables
-- for multi-language name detection in AI responses

ALTER TABLE organizations
  ADD COLUMN alternate_names text[] NOT NULL DEFAULT '{}';

ALTER TABLE competitors
  ADD COLUMN alternate_names text[] NOT NULL DEFAULT '{}';
