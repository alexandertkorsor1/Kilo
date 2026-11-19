/*
# Tighten inquiries table grants to insert-only

1. Modified Tables
- `inquiries`: revoke SELECT, UPDATE, DELETE from anon and authenticated so the
  public API can only INSERT. The insert-only RLS policy stays unchanged.
- No data changes; security hardening only.
*/

REVOKE SELECT, UPDATE, DELETE ON inquiries FROM anon, authenticated;
