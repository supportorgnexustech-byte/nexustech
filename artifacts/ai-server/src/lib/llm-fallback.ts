/**
 * LLM Fallback Chain
 * Order: 1. Gemini → 2. GPT (OpenAI) → 3. Groq (last resort)
 *
 * Reads API keys from environment variables:
 *   GEMINI_API_KEY
 *   GPT_API_KEY      / OPENAI_API_KEY
 *   GROQ_API_KEY     / GROK_KEY
 */

interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
}

// Gemini model variants tried in order (only models valid for v1beta free tier)
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
];

// Groq models tried in order — confirmed active (non-decommissioned)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

// ---------------------------------------------------------------------------
// Provider: Gemini
// ---------------------------------------------------------------------------
async function tryGemini(key: string, prompt: string, opts: LLMOptions): Promise<string | null> {
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: opts.temperature ?? 0.7,
              maxOutputTokens: opts.maxTokens ?? 1024,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json() as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[LLM] Gemini responded (model: ${model})`);
          return text;
        }
      } else {
        const errorBody = await response.json().catch(() => ({})) as any;
        const retryDelay = errorBody?.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"))?.retryDelay;
        console.warn(
          `[LLM] Gemini model ${model} failed: HTTP ${response.status}` +
          `${retryDelay ? ` (retry after ${retryDelay})` : ""} – ` +
          `${errorBody?.error?.message?.slice(0, 120) ?? "unknown"}`
        );
      }
    } catch (e: any) {
      console.warn(`[LLM] Gemini model ${model} fetch error:`, e.message);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Provider: Groq  (OpenAI-compatible API, ultra-fast inference, generous free tier)
// ---------------------------------------------------------------------------
async function tryGroq(key: string, prompt: string, opts: LLMOptions): Promise<string | null> {
  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: opts.maxTokens ?? 1024,
          temperature: opts.temperature ?? 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          console.log(`[LLM] Groq responded (model: ${model})`);
          return text;
        }
      } else {
        const retryAfter = response.headers.get("retry-after") ?? response.headers.get("Retry-After");
        const errorBody = await response.json().catch(() => ({})) as any;
        console.warn(
          `[LLM] Groq model ${model} failed: HTTP ${response.status}` +
          `${retryAfter ? ` (retry after ${retryAfter}s)` : ""} – ` +
          `${errorBody?.error?.message?.slice(0, 120) ?? "unknown"}`
        );
      }
    } catch (e: any) {
      console.warn(`[LLM] Groq model ${model} fetch error:`, e.message);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Tries LLMs in priority order: Gemini → GPT → Groq
 * Returns the first successful response text, or throws Error("ALL_LLMS_FAILED").
 */
export async function fallbackLLM(prompt: string, options?: LLMOptions): Promise<string> {
  const geminiKey  = process.env.GEMINI_API_KEY;
  const openaiKey  = process.env.GPT_API_KEY || process.env.OPENAI_API_KEY;
  const groqKey    = process.env.GROQ_API_KEY || process.env.GROK_KEY;

  // 1. Gemini (primary)
  if (geminiKey) {
    const result = await tryGemini(geminiKey, prompt, options ?? {});
    if (result) return result;
    console.warn("[LLM] All Gemini models failed, falling back to GPT...");
  } else {
    console.warn("[LLM] GEMINI_API_KEY not set, skipping Gemini.");
  }


  // 3. Groq (last resort – ultra-fast, generous free tier)
  if (groqKey) {
    const result = await tryGroq(groqKey, prompt, options ?? {});
    if (result) return result;
    console.warn("[LLM] All Groq models failed.");
  } else {
    console.warn("[LLM] GROQ_API_KEY not set, skipping Groq.");
  }

  // All providers exhausted
  throw new Error("ALL_LLMS_FAILED");
}
