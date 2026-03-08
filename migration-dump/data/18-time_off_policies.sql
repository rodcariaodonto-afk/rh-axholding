-- time_off_policies
INSERT INTO public.time_off_policies (id, name, description, default_days_per_year, requires_approval, is_active) VALUES
  (gen_random_uuid(), 'Férias', 'Férias anuais CLT', 30, true, true),
  (gen_random_uuid(), 'Day Off', 'Dia de folga', 12, true, true),
  (gen_random_uuid(), 'Licença Médica', 'Atestado médico', 0, false, true);
