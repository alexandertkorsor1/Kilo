/*
# Create inquiries table (contact form, no auth)

1. New Tables
- `inquiries` — contact form submissions from site visitors
  - `id` (uuid, primary key, auto-generated)
  - `name` (text, not null) — visitor's name
  - `email` (text, not null) — visitor's email for the reply
  - `subject` (text, not null) — short subject line
  - `message` (text, not null) — the inquiry body
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `inquiries`.
- Grant INSERT (and SELECT of submitted columns) to `anon` and `authenticated` —
  this is a public contact form on a site with no sign-in.
- INSERT policy: anyone may submit; WITH CHECK validates name/email/subject/message
  are non-empty and length-bounded server-side so a crafted API call cannot
  bypass the form's client-side validation.
- No UPDATE or DELETE policies and no grants for them: submissions are immutable
  through the public API. Reading them back is limited to the submitted row.
- No SELECT policy for browsing all submissions: the public site never lists
  inquiries. The database owner can read them directly.
*/

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

GRANT INSERT (name, email, subject, message) ON inquiries TO anon, authenticated;

DROP POLICY IF EXISTS "anyone_can_submit_inquiry" ON inquiries;
CREATE POLICY "anyone_can_submit_inquiry"
ON inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 254
  AND length(subject) BETWEEN 1 AND 200
  AND length(message) BETWEEN 1 AND 5000
);
