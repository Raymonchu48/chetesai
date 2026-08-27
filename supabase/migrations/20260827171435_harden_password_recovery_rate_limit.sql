create policy "Solo el backend limita recuperaciones"
  on public.password_recovery_attempts
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
