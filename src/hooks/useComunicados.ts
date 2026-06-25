/*
  TODO: Criar a tabela no Supabase antes de usar este módulo.

  DDL:
  create table public.comunicados (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    title text not null,
    message text not null,
    priority text not null default 'normal' check (priority in ('normal', 'importante', 'urgente')),
    destinatario_tipo text not null default 'todos'
      check (destinatario_tipo in ('todos', 'departamento', 'unidade', 'individual')),
    department_id uuid references public.departments(id) on delete set null,
    unit_id uuid references public.units(id) on delete set null,
    employee_id uuid references public.employees(id) on delete cascade,
    expires_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
  );

  -- RLS
  alter table public.comunicados enable row level security;

  create policy "org members read" on public.comunicados
    for select using (
      organization_id in (
        select organization_id from public.organization_members where user_id = auth.uid()
      )
    );

  create policy "people/admin insert" on public.comunicados
    for insert with check (
      organization_id in (
        select organization_id from public.organization_members
        where user_id = auth.uid() and role in ('admin', 'people')
      )
    );

  create policy "people/admin delete" on public.comunicados
    for delete using (
      organization_id in (
        select organization_id from public.organization_members
        where user_id = auth.uid() and role in ('admin', 'people')
      )
    );

  -- Index útil
  create index comunicados_org_created on public.comunicados (organization_id, created_at desc);
  create index comunicados_employee on public.comunicados (employee_id) where employee_id is not null;
*/

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export type ComunicadoPriority = "normal" | "importante" | "urgente";
export type ComunicadoDestinatarioTipo = "todos" | "departamento" | "unidade" | "individual";

export interface Comunicado {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  priority: ComunicadoPriority;
  destinatario_tipo: ComunicadoDestinatarioTipo;
  department_id: string | null;
  unit_id: string | null;
  employee_id: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateComunicadoPayload {
  title: string;
  message: string;
  priority: ComunicadoPriority;
  destinatario_tipo: ComunicadoDestinatarioTipo;
  department_id?: string | null;
  unit_id?: string | null;
  employee_id?: string | null;
  expires_at?: string | null;
}

export function useComunicados() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["comunicados", organizationId],
    enabled: !!organizationId,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("comunicados")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comunicado[];
    },
  });
}

export function useComunicadosByEmployee(employeeId: string | undefined) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["comunicados", organizationId, "employee", employeeId],
    enabled: !!organizationId && !!employeeId,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("comunicados")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comunicado[];
    },
  });
}

export function useCreateComunicado() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (payload: CreateComunicadoPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from("comunicados")
        .insert({
          ...payload,
          organization_id: organizationId,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Comunicado;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comunicados", organizationId] });
      toast.success("Comunicado publicado com sucesso.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateComunicadoIndividual() {
  return useCreateComunicado();
}

export function useDeleteComunicado() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("comunicados")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comunicados", organizationId] });
      toast.success("Comunicado removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
