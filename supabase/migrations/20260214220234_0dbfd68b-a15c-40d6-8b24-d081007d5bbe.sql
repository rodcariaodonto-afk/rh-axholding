
-- Add email sender configuration to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS invite_from_email text,
  ADD COLUMN IF NOT EXISTS invite_from_name text;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.invite_from_email IS 'Email remetente para convites via Resend (ex: rh@empresa.com)';
COMMENT ON COLUMN public.organizations.invite_from_name IS 'Nome visível do remetente para convites via Resend (ex: RH Empresa)';
