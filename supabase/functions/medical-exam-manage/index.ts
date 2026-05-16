import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "create_schedule"
  | "update_schedule"
  | "cancel_schedule"
  | "register_exam"
  | "signed_upload_url"
  | "attach_file"
  | "delete_exam";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });

    const orgAuth = await checkOrgRole(supabaseAdmin, user.id, ["admin", "people"]);
    if (!orgAuth.authorized) return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: corsHeaders });

    const body = await req.json() as { action: Action; [k: string]: unknown };
    const action = body.action;
    const orgId = orgAuth.organizationId!;

    if (action === "create_schedule") {
      const { employee_id, exam_type, scheduled_at, clinic_name, clinic_address, clinic_phone, doctor_name, notes } = body as any;
      if (!employee_id || !exam_type || !scheduled_at) {
        return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), { status: 400, headers: corsHeaders });
      }
      const { data, error } = await supabaseAdmin.from("medical_exam_schedules").insert({
        organization_id: orgId,
        employee_id, exam_type, scheduled_at, clinic_name, clinic_address, clinic_phone, doctor_name, notes,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      await supabaseAdmin.from("medical_exam_events").insert({
        organization_id: orgId, schedule_id: data.id, event_type: "scheduled", actor_user_id: user.id,
        metadata: { exam_type, scheduled_at },
      });
      return json({ ok: true, schedule: data });
    }

    if (action === "update_schedule") {
      const { schedule_id, ...patch } = body as any;
      const { error } = await supabaseAdmin.from("medical_exam_schedules").update(patch).eq("id", schedule_id).eq("organization_id", orgId);
      if (error) throw error;
      await supabaseAdmin.from("medical_exam_events").insert({
        organization_id: orgId, schedule_id, event_type: "schedule_updated", actor_user_id: user.id, metadata: patch,
      });
      return json({ ok: true });
    }

    if (action === "cancel_schedule") {
      const { schedule_id, reason } = body as any;
      const { error } = await supabaseAdmin.from("medical_exam_schedules").update({
        status: "cancelado", notes: reason ? `Cancelado: ${reason}` : undefined,
      }).eq("id", schedule_id).eq("organization_id", orgId);
      if (error) throw error;
      await supabaseAdmin.from("medical_exam_events").insert({
        organization_id: orgId, schedule_id, event_type: "cancelled", actor_user_id: user.id, metadata: { reason },
      });
      return json({ ok: true });
    }

    if (action === "register_exam") {
      const {
        employee_id, exam_type, exam_date, valid_until, doctor_name, doctor_crm,
        clinic_name, result, restrictions, file_path, notes, schedule_id,
      } = body as any;
      if (!employee_id || !exam_type || !exam_date) {
        return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), { status: 400, headers: corsHeaders });
      }
      const { data: exam, error } = await supabaseAdmin.from("medical_exams").insert({
        organization_id: orgId,
        employee_id, exam_type, exam_date, valid_until, doctor_name, doctor_crm,
        clinic_name, result, restrictions, file_path, notes, created_by: user.id,
      }).select().single();
      if (error) throw error;
      if (schedule_id) {
        await supabaseAdmin.from("medical_exam_schedules").update({
          status: "realizado", exam_id: exam.id,
        }).eq("id", schedule_id).eq("organization_id", orgId);
      }
      await supabaseAdmin.from("medical_exam_events").insert({
        organization_id: orgId, exam_id: exam.id, schedule_id: schedule_id ?? null,
        event_type: "exam_registered", actor_user_id: user.id, metadata: { result, exam_type },
      });
      return json({ ok: true, exam });
    }

    if (action === "signed_upload_url") {
      const { employee_id, file_name } = body as any;
      if (!employee_id || !file_name) {
        return new Response(JSON.stringify({ error: "employee_id e file_name obrigatórios" }), { status: 400, headers: corsHeaders });
      }
      const safeName = String(file_name).replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${orgId}/${employee_id}/${Date.now()}_${safeName}`;
      const { data, error } = await (supabaseAdmin.storage.from("medical-exams") as any).createSignedUploadUrl(path);
      if (error) throw error;
      return json({ ok: true, path, token: data.token, signed_url: data.signedUrl });
    }

    if (action === "attach_file") {
      const { exam_id, file_path } = body as any;
      const { error } = await supabaseAdmin.from("medical_exams").update({ file_path }).eq("id", exam_id).eq("organization_id", orgId);
      if (error) throw error;
      await supabaseAdmin.from("medical_exam_events").insert({
        organization_id: orgId, exam_id, event_type: "file_attached", actor_user_id: user.id, metadata: { file_path },
      });
      return json({ ok: true });
    }

    if (action === "delete_exam") {
      const { exam_id } = body as any;
      const { error } = await supabaseAdmin.from("medical_exams").delete().eq("id", exam_id).eq("organization_id", orgId);
      if (error) throw error;
      return json({ ok: true });
    }

    return new Response(JSON.stringify({ error: "action inválido" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("medical-exam-manage error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
