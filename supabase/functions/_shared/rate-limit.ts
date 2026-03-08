/**
 * Rate Limiting Module for Edge Functions
 * SEC-007: Implementar rate limiting
 *
 * Uses a PostgreSQL table + RPC function for atomic rate limit checking.
 * Each request is tracked by a composite key (user ID or IP) + function name.
 *
 * Usage:
 *   import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";
 *
 *   const rlKey = getRateLimitKey(req, userId);
 *   const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
 *   if (!rl.allowed) return rl.response!;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = any;
import { corsHeaders } from "./cors.ts";

// ============================================
// Types
// ============================================

/** Rate limit configuration per function */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds (default: 60) */
  windowSeconds?: number;
}

/** Result returned by the check_rate_limit RPC */
interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  reset_at: string;
}

// ============================================
// Default Limits
// ============================================

/** Default rate limits per function (requests per window) */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // AI functions
  "analyze-candidate": { maxRequests: 50, windowSeconds: 60 },
  "generate-position-description": { maxRequests: 50, windowSeconds: 60 },

  // Public endpoint — spam protection (30/min por IP)
  "submit-application": { maxRequests: 30, windowSeconds: 60 },

  // Employee management
  "invite-employee": { maxRequests: 10, windowSeconds: 60 },
  "delete-employee": { maxRequests: 5, windowSeconds: 60 },
  "terminate-employee": { maxRequests: 10, windowSeconds: 60 },
  "change-user-role": { maxRequests: 10, windowSeconds: 60 },

  // Secrets/integrations
  "manage-secrets": { maxRequests: 20, windowSeconds: 60 },

  // GitHub proxy — higher throughput
  "github-repos": { maxRequests: 30, windowSeconds: 60 },
  "github-releases": { maxRequests: 30, windowSeconds: 60 },
  "github-tags": { maxRequests: 30, windowSeconds: 60 },
};

// ============================================
// Core Functions
// ============================================

/**
 * Build standard rate limit response headers.
 */
function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.reset_at,
  };
}

/**
 * Check rate limit for a request.
 *
 * Calls the `check_rate_limit` PostgreSQL function which atomically
 * checks the count and inserts a new entry if allowed.
 *
 * **Fail-open**: if the RPC call fails, the request is allowed through.
 *
 * @param supabaseAdmin - Service role Supabase client
 * @param key - Rate limit key (from getRateLimitKey)
 * @param functionName - Edge function name (used to look up default limits)
 * @param config - Optional override for rate limit config
 * @returns Object with `allowed`, `headers`, and optional `response` (429)
 */
export async function checkRateLimit(
  supabaseAdmin: SupabaseClientAny,
  key: string,
  functionName: string,
  config?: RateLimitConfig,
): Promise<{
  allowed: boolean;
  headers: Record<string, string>;
  response?: Response;
}> {
  const effectiveConfig =
    config || RATE_LIMITS[functionName] || { maxRequests: 30, windowSeconds: 60 };
  const { maxRequests, windowSeconds = 60 } = effectiveConfig;

  try {
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_key: key,
      p_function_name: functionName,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error(`[rate-limit][${functionName}] RPC error: ${error.message}`);
      // Fail open — allow request if rate limit check fails
      return { allowed: true, headers: {} };
    }

    const result = data as RateLimitResult;
    const headers = buildRateLimitHeaders(result);

    if (!result.allowed) {
      console.warn(
        `[rate-limit][${functionName}] BLOCKED key=${key} count=${result.count}/${result.limit}`,
      );
      return {
        allowed: false,
        headers,
        response: new Response(
          JSON.stringify({
            type: "about:blank",
            title: "Too Many Requests",
            status: 429,
            detail: `Limite de requisições excedido (${result.limit} req/${windowSeconds}s). Tente novamente em instantes.`,
            retry_after: windowSeconds,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              ...headers,
              "Content-Type": "application/problem+json",
              "Retry-After": String(windowSeconds),
            },
          },
        ),
      };
    }

    return { allowed: true, headers };
  } catch (err) {
    console.error(`[rate-limit][${functionName}] Unexpected error:`, err);
    // Fail open
    return { allowed: true, headers: {} };
  }
}

/**
 * Extract rate limit key from request.
 * Uses user ID if authenticated, otherwise falls back to IP address.
 */
export function getRateLimitKey(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;

  // Try common proxy headers for client IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  // Supabase Edge Functions set cf-connecting-ip via Cloudflare
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return `ip:${cfIp}`;

  return `ip:unknown`;
}

/**
 * Merge rate limit headers into an existing headers object.
 * Useful for adding rate limit info to successful responses.
 */
export function withRateLimitHeaders(
  baseHeaders: Record<string, string>,
  rlHeaders: Record<string, string>,
): Record<string, string> {
  return { ...baseHeaders, ...rlHeaders };
}
