/**
 * Zod validation schemas for Edge Functions
 * Centralized input validation for security and consistency
 */
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

// ============================================
// Common schemas
// ============================================

export const UUIDSchema = z.string().uuid();

export const EmailSchema = z.string().email().max(255);

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// Integration Management schemas
// ============================================

export const IntegrationProviderSchema = z.enum([
  'anthropic',
  'fireflies', 
  'openai',
  'github',
  'resend',
]);

export const IntegrationSensitivitySchema = z.enum([
  'standard',
  'high', 
  'critical',
]);

export const CreateIntegrationSchema = z.object({
  organization_id: UUIDSchema,
  provider: IntegrationProviderSchema,
  api_key: z.string().min(10).max(500),
  display_name: z.string().max(100).optional(),
  test_connection: z.boolean().default(false),
  sensitivity: IntegrationSensitivitySchema.default('standard'),
});

export const TestIntegrationSchema = z.object({
  organization_id: UUIDSchema,
  id: UUIDSchema,
  action: z.literal('test'),
});

export const DeleteIntegrationSchema = z.object({
  organization_id: UUIDSchema,
  id: UUIDSchema,
});

export const ListIntegrationsSchema = z.object({
  organization_id: UUIDSchema,
});

// ============================================
// Candidate Analysis schemas
// ============================================

export const CandidateDataSchema = z.object({
  candidate_name: z.string().min(2).max(200),
  candidate_email: EmailSchema,
  candidate_phone: z.string().max(30).optional(),
  candidate_birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  candidate_city: z.string().max(100).optional(),
  candidate_state: z.string().max(50).optional(),
});

export const AnalyzeCandidateSchema = z.object({
  candidateEmail: EmailSchema,
  jobId: UUIDSchema,
  jobData: z.object({
    title: z.string().max(200),
    description: z.string().optional(),
    requirements: z.string().optional(),
  }).optional(),
  candidateData: CandidateDataSchema.optional(),
  profilerResult: z.record(z.unknown()).optional(),
  resumeUrl: z.string().url().optional(),
  desiredPosition: z.string().max(100).optional(),
  desiredSeniority: z.string().max(50).optional(),
});

// ============================================
// Employee Management schemas
// ============================================

export const InviteEmployeeSchema = z.object({
  email: EmailSchema,
  full_name: z.string().min(2).max(200),
  organization_id: UUIDSchema.optional(),
});

export const TerminateEmployeeSchema = z.object({
  employee_id: UUIDSchema,
  termination_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  termination_reason: z.string().max(500).optional(),
  termination_cause: z.string().max(100).optional(),
  termination_cost: z.number().min(0).optional(),
});

export const DeleteEmployeeSchema = z.object({
  employee_id: UUIDSchema,
});

// ============================================
// Position Description schemas
// ============================================

export const GeneratePositionDescriptionSchema = z.object({
  position_type: z.string().min(2).max(100),
  seniority: z.string().min(2).max(50),
  organization_context: z.string().max(2000).optional(),
});

// ============================================
// GitHub Integration schemas
// ============================================

export const GitHubReposSchema = z.object({
  owner: z.string().min(1).max(100).optional(),
});

export const GitHubReleasesSchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
});

export const GitHubTagsSchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
});

// ============================================
// Helper function for validation
// ============================================

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// ============================================
// Error response helper
// ============================================

export function zodErrorResponse(error: z.ZodError, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      type: "about:blank",
      title: "Validation Error",
      status: 400,
      detail: "Invalid request data",
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' } 
    }
  );
}
