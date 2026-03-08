import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

const sanitizeString = (str: string | null | undefined, maxLength = 500): string | null => {
  if (!str) return null;
  return str.trim().slice(0, maxLength);
};

const sanitizePhone = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  // Only allow digits, spaces, parentheses, hyphens, and plus sign
  return phone.replace(/[^\d\s()\-+]/g, "").slice(0, 20);
};

// Allowed values for controlled fields (synced with src/constants/brazilData.ts)
const ALLOWED_RACES = [
  "branco", "preto", "pardo", "amarelo", "indigena", "nao_declarar"
];
const ALLOWED_GENDERS = [
  "masculino", "feminino", "nao_binarie", "fluido", 
  "nao_binario", "outro", "prefiro_nao_informar", "nao_declarar"
];
const ALLOWED_ORIENTATIONS = [
  "heterossexual", "homossexual", "bissexual", "assexual", 
  "pansexual", "outro", "prefiro_nao_responder", "nao_declarar"
];
const ALLOWED_SENIORITIES = [
  "estagiario", "junior", "pleno", "senior", "especialista", "lideranca"
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // === SECURITY: Rate limiting by IP (SEC-007) ===
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const rlKey = getRateLimitKey(req); // No userId — public endpoint, uses IP
  const rl = await checkRateLimit(supabaseAdmin, rlKey, "submit-application");
  if (!rl.allowed) return rl.response!;

  try {
    const body = await req.json();

    // === REQUIRED FIELD VALIDATION ===
    const { job_id, candidate_name, candidate_email, candidate_birth_date } = body;

    if (!job_id || !isValidUUID(job_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing job_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!candidate_name || typeof candidate_name !== "string" || candidate_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Name must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!candidate_email || !isValidEmail(candidate_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!candidate_birth_date || !isValidDate(candidate_birth_date)) {
      return new Response(
        JSON.stringify({ error: "Invalid birth date format (expected YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate birth date is reasonable (between 16 and 100 years old)
    const birthDate = new Date(candidate_birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 16 || age > 100) {
      return new Response(
        JSON.stringify({ error: "Birth date out of valid range" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === OPTIONAL FIELD VALIDATION & SANITIZATION ===
    const sanitizedData = {
      job_id,
      candidate_name: sanitizeString(candidate_name, 200),
      candidate_email: candidate_email.trim().toLowerCase().slice(0, 255),
      candidate_birth_date,
      resume_url: body.resume_url && typeof body.resume_url === "string" 
        ? sanitizeString(body.resume_url, 1000) 
        : null,
      profiler_result_code: sanitizeString(body.profiler_result_code, 50),
      profiler_result_detail: body.profiler_result_detail || null,
      profiler_completed_at: body.profiler_result_code ? new Date().toISOString() : null,
      status: "pending",
      candidate_state: sanitizeString(body.candidate_state, 50),
      candidate_city: sanitizeString(body.candidate_city, 100),
      candidate_phone: sanitizePhone(body.candidate_phone),
      candidate_race: ALLOWED_RACES.includes(body.candidate_race) ? body.candidate_race : null,
      candidate_gender: ALLOWED_GENDERS.includes(body.candidate_gender) ? body.candidate_gender : null,
      candidate_sexual_orientation: ALLOWED_ORIENTATIONS.includes(body.candidate_sexual_orientation) 
        ? body.candidate_sexual_orientation 
        : null,
      candidate_pcd: body.candidate_pcd === true,
      candidate_pcd_type: body.candidate_pcd === true 
        ? sanitizeString(body.candidate_pcd_type, 200) 
        : null,
      desired_position: sanitizeString(body.desired_position, 100),
      desired_seniority: ALLOWED_SENIORITIES.includes(body.desired_seniority) 
        ? body.desired_seniority 
        : null,
    };

    // === DATABASE INSERT WITH SERVICE ROLE ===
    // Reuse supabaseAdmin created above for rate limiting
    const supabase = supabaseAdmin;

    // Verify job exists and is active
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (job.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Job is not accepting applications" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate application (same email + job)
    const { data: existing, error: existingError } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", job_id)
      .eq("candidate_email", sanitizedData.candidate_email)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "You have already applied for this position" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert application with pending AI analysis status if resume is present
    const insertData = {
      ...sanitizedData,
      ai_analysis_status: sanitizedData.resume_url ? 'pending' : 'not_requested',
    };

    const { data: application, error: insertError } = await supabase
      .from("job_applications")
      .insert(insertData)
      .select("id")
      .single();

    if (insertError) {
      console.error("[submit-application] Insert error:", insertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to submit application" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === TRIGGER AI ANALYSIS IN BACKGROUND ===
    // Only if candidate has a resume
    if (sanitizedData.resume_url) {
      // Fire-and-forget: don't await, don't block the response
      (async () => {
        try {
          console.log("[submit-application] Triggering AI analysis for application:", application.id);
          
          // Fetch job data for the analysis
          const { data: jobData } = await supabase
            .from("jobs")
            .select(`
              id, title, description, requirements, seniority,
              positions:position_id(id, title),
              departments:department_id(id, name)
            `)
            .eq("id", job_id)
            .single();

          // Build candidate data for analysis
          const candidateData = {
            candidate_name: sanitizedData.candidate_name,
            candidate_email: sanitizedData.candidate_email,
            candidate_birth_date: sanitizedData.candidate_birth_date,
          };

          // Get profiler result if available
          const profilerResult = sanitizedData.profiler_result_detail || null;

          // Call analyze-candidate edge function directly via HTTP
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

          const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-candidate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              candidateEmail: sanitizedData.candidate_email,
              jobId: job_id,
              jobData,
              candidateData,
              profilerResult,
              resumeUrl: sanitizedData.resume_url,
              desiredPosition: sanitizedData.desired_position,
              desiredSeniority: sanitizedData.desired_seniority,
            }),
          });

          if (!analyzeResponse.ok) {
            const errorText = await analyzeResponse.text();
            console.error("[submit-application] AI analysis failed:", analyzeResponse.status, errorText);
          } else {
            console.log("[submit-application] AI analysis completed successfully");
          }
        } catch (err) {
          console.error("[submit-application] Error triggering AI analysis:", err);
        }
      })();
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        applicationId: application.id,
        message: "Application submitted successfully" 
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing application:", error);
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
