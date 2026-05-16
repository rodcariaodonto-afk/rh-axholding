// Gestão de lote de holerites/recibos: criação, matching, publicação
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FileItem = { file_path: string; file_name: string; file_size?: number };

function extractCpf(filename: string): string | null {
  const digits = filename.replace(/\D/g, "");
  // procurar sequência de exatamente 11 dígitos (CPF)
  const m = digits.match(/(\d{11})/);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });

    const auth = await checkOrgRole(supabaseAdmin, user.id, ["admin", "people"]);
    if (!auth.authorized || !auth.organizationId) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: corsHeaders });
    }
    const orgId = auth.organizationId;

    const body = await req.json();
    const { action } = body as { action: string };

    // ============== CREATE ==============
    if (action === "create") {
      const { competency, receipt_type, description } = body;
      if (!competency || !receipt_type) {
        return new Response(JSON.stringify({ error: "competency e receipt_type obrigatórios" }), { status: 400, headers: corsHeaders });
      }
      const { data: batch, error } = await supabaseAdmin.from("payroll_receipt_batches").insert({
        organization_id: orgId,
        competency,
        receipt_type,
        description,
        created_by: user.id,
        status: "draft",
      }).select().single();
      if (error) throw error;
      await supabaseAdmin.from("payroll_receipt_events").insert({
        batch_id: batch.id, organization_id: orgId, event_type: "batch_created", actor_user_id: user.id,
        metadata: { competency, receipt_type },
      });
      return new Response(JSON.stringify({ batch }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============== SIGNED UPLOAD URL ==============
    if (action === "signed_upload_url") {
      const { batch_id, file_name } = body;
      const { data: batch } = await supabaseAdmin.from("payroll_receipt_batches").select("organization_id").eq("id", batch_id).single();
      if (!batch || batch.organization_id !== orgId) {
        return new Response(JSON.stringify({ error: "Batch não encontrado" }), { status: 404, headers: corsHeaders });
      }
      const ext = (file_name as string).split(".").pop() || "pdf";
      const path = `${batch_id}/${crypto.randomUUID()}.${ext}`;
      const { data: signed, error } = await supabaseAdmin.storage.from("payroll-receipts").createSignedUploadUrl(path);
      if (error) throw error;
      return new Response(JSON.stringify({ ...signed, path }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============== ADD FILES (após upload no storage) ==============
    if (action === "add_files") {
      const { batch_id, files } = body as { batch_id: string; files: FileItem[] };
      const { data: batch } = await supabaseAdmin.from("payroll_receipt_batches")
        .select("*").eq("id", batch_id).eq("organization_id", orgId).single();
      if (!batch) return new Response(JSON.stringify({ error: "Batch não encontrado" }), { status: 404, headers: corsHeaders });
      if (batch.status !== "draft" && batch.status !== "matching") {
        return new Response(JSON.stringify({ error: "Batch já publicado ou cancelado" }), { status: 400, headers: corsHeaders });
      }

      // Buscar todos employees ativos com CPF
      const { data: legalDocs } = await supabaseAdmin
        .from("employees_legal_docs")
        .select("user_id, cpf")
        .not("cpf", "is", null);
      const { data: orgEmployees } = await supabaseAdmin
        .from("employees")
        .select("id, full_name, email")
        .eq("organization_id", orgId)
        .neq("status", "terminated");

      const orgEmpIds = new Set((orgEmployees || []).map((e) => e.id));
      const cpfMap = new Map<string, string>();
      for (const d of legalDocs || []) {
        if (d.cpf && d.user_id && orgEmpIds.has(d.user_id)) {
          cpfMap.set(d.cpf.replace(/\D/g, ""), d.user_id);
        }
      }

      const rows = files.map((f) => {
        const cpf = extractCpf(f.file_name);
        const employee_id = cpf ? cpfMap.get(cpf) || null : null;
        return {
          batch_id,
          organization_id: orgId,
          file_path: f.file_path,
          file_name: f.file_name,
          file_size: f.file_size || null,
          cpf_lookup: cpf,
          employee_id,
          match_status: employee_id ? "matched" : "unmatched",
        };
      });

      const { error: insErr } = await supabaseAdmin.from("payroll_receipts").insert(rows);
      if (insErr) throw insErr;

      // Recalcular contadores
      const matched = rows.filter((r) => r.match_status === "matched").length;
      const unmatched = rows.length - matched;
      await supabaseAdmin.from("payroll_receipt_batches").update({
        total_files: batch.total_files + rows.length,
        matched_count: batch.matched_count + matched,
        unmatched_count: batch.unmatched_count + unmatched,
        status: "matching",
      }).eq("id", batch_id);

      await supabaseAdmin.from("payroll_receipt_events").insert({
        batch_id, organization_id: orgId, event_type: "files_added", actor_user_id: user.id,
        metadata: { added: rows.length, matched, unmatched },
      });

      return new Response(JSON.stringify({ added: rows.length, matched, unmatched }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============== REASSIGN (manual match) ==============
    if (action === "reassign") {
      const { receipt_id, employee_id } = body;
      const { data: receipt } = await supabaseAdmin.from("payroll_receipts")
        .select("organization_id, match_status, batch_id").eq("id", receipt_id).single();
      if (!receipt || receipt.organization_id !== orgId) {
        return new Response(JSON.stringify({ error: "Recibo não encontrado" }), { status: 404, headers: corsHeaders });
      }
      const previousStatus = receipt.match_status;
      await supabaseAdmin.from("payroll_receipts").update({
        employee_id, match_status: employee_id ? "matched" : "unmatched",
      }).eq("id", receipt_id);

      // ajustar contadores
      if (previousStatus !== "matched" && employee_id) {
        await supabaseAdmin.rpc as unknown; // não temos RPC; faremos via SQL inline:
        await supabaseAdmin.from("payroll_receipt_batches").update({
          matched_count: ((await supabaseAdmin.from("payroll_receipts").select("id", { count: "exact", head: true })
            .eq("batch_id", receipt.batch_id).eq("match_status", "matched")).count || 0),
          unmatched_count: ((await supabaseAdmin.from("payroll_receipts").select("id", { count: "exact", head: true })
            .eq("batch_id", receipt.batch_id).eq("match_status", "unmatched")).count || 0),
        }).eq("id", receipt.batch_id);
      }

      await supabaseAdmin.from("payroll_receipt_events").insert({
        receipt_id, batch_id: receipt.batch_id, organization_id: orgId,
        event_type: "manual_reassign", actor_user_id: user.id, metadata: { employee_id },
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============== DELETE RECEIPT ==============
    if (action === "delete_receipt") {
      const { receipt_id } = body;
      const { data: receipt } = await supabaseAdmin.from("payroll_receipts")
        .select("organization_id, batch_id, file_path, match_status").eq("id", receipt_id).single();
      if (!receipt || receipt.organization_id !== orgId) {
        return new Response(JSON.stringify({ error: "Recibo não encontrado" }), { status: 404, headers: corsHeaders });
      }
      await supabaseAdmin.storage.from("payroll-receipts").remove([receipt.file_path]);
      await supabaseAdmin.from("payroll_receipts").delete().eq("id", receipt_id);

      const { count: matched } = await supabaseAdmin.from("payroll_receipts").select("id", { count: "exact", head: true })
        .eq("batch_id", receipt.batch_id).eq("match_status", "matched");
      const { count: unmatched } = await supabaseAdmin.from("payroll_receipts").select("id", { count: "exact", head: true })
        .eq("batch_id", receipt.batch_id).eq("match_status", "unmatched");
      const { count: total } = await supabaseAdmin.from("payroll_receipts").select("id", { count: "exact", head: true })
        .eq("batch_id", receipt.batch_id);
      await supabaseAdmin.from("payroll_receipt_batches").update({
        matched_count: matched || 0, unmatched_count: unmatched || 0, total_files: total || 0,
      }).eq("id", receipt.batch_id);

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============== PUBLISH ==============
    if (action === "publish") {
      const { batch_id } = body;
      const { data: batch } = await supabaseAdmin.from("payroll_receipt_batches")
        .select("*").eq("id", batch_id).eq("organization_id", orgId).single();
      if (!batch) return new Response(JSON.stringify({ error: "Batch não encontrado" }), { status: 404, headers: corsHeaders });
      if (batch.matched_count === 0) {
        return new Response(JSON.stringify({ error: "Nenhum recibo com match para publicar" }), { status: 400, headers: corsHeaders });
      }

      const { error: upErr } = await supabaseAdmin.from("payroll_receipts").update({ published: true })
        .eq("batch_id", batch_id).eq("match_status", "matched");
      if (upErr) throw upErr;

      await supabaseAdmin.from("payroll_receipt_batches").update({
        status: "published", published_at: new Date().toISOString(), published_by: user.id,
      }).eq("id", batch_id);

      await supabaseAdmin.from("payroll_receipt_events").insert({
        batch_id, organization_id: orgId, event_type: "batch_published",
        actor_user_id: user.id, metadata: { published_count: batch.matched_count },
      });

      return new Response(JSON.stringify({ ok: true, published: batch.matched_count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============== CANCEL ==============
    if (action === "cancel") {
      const { batch_id } = body;
      const { data: batch } = await supabaseAdmin.from("payroll_receipt_batches")
        .select("organization_id, status").eq("id", batch_id).single();
      if (!batch || batch.organization_id !== orgId) {
        return new Response(JSON.stringify({ error: "Batch não encontrado" }), { status: 404, headers: corsHeaders });
      }
      if (batch.status === "published") {
        return new Response(JSON.stringify({ error: "Não é possível cancelar lote já publicado" }), { status: 400, headers: corsHeaders });
      }
      await supabaseAdmin.from("payroll_receipt_batches").update({ status: "cancelled" }).eq("id", batch_id);
      await supabaseAdmin.from("payroll_receipt_events").insert({
        batch_id, organization_id: orgId, event_type: "batch_cancelled", actor_user_id: user.id,
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "action inválida" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("payroll-batch error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
