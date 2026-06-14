/**
 * test-llms.ts – Test all AI provider APIs
 *
 * Run with:
 *   npx tsx test-llms.ts
 *
 * Reads keys from .env automatically (no dotenv dependency needed).
 *
 * Fallback chain tested: Gemini → GPT → Groq
 */

import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Load .env manually
// ---------------------------------------------------------------------------
function loadEnv(): void {
  try {
    const envPath = join(process.cwd(), ".env");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const rawVal = trimmed.slice(eqIdx + 1).trim();
      const val = rawVal.replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env not found – rely on actual env vars
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const PROMPT = "Say exactly: 'Hello from Nexus AI!' and nothing else.";
const MAX_TOKENS = 50;

function pad(s: string, n: number) {
  return s.padEnd(n, " ");
}

function badge(ok: boolean) {
  return ok ? "✅ PASS" : "❌ FAIL";
}

interface TestResult {
  provider: string;
  model: string;
  status: "pass" | "fail";
  latencyMs: number;
  response?: string;
  error?: string;
  httpStatus?: number;
}

const results: TestResult[] = [];

function push(r: TestResult) {
  results.push(r);
}

// ---------------------------------------------------------------------------
// Provider: Gemini
// ---------------------------------------------------------------------------
async function testGemini(key: string): Promise<void> {
  console.log("\n🟦 Testing Gemini...");
  const models = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
  ];

  for (const model of models) {
    const t0 = Date.now();
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT }] }],
            generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.1 },
          }),
        }
      );
      const ms = Date.now() - t0;
      if (res.ok) {
        const data = await res.json() as any;
        const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
        push({ provider: "Gemini", model, status: "pass", latencyMs: ms, response: text, httpStatus: res.status });
        console.log(`  ${badge(true)}  ${pad(model, 30)}  ${ms}ms  →  "${text.slice(0, 60)}"`);
      } else {
        const err = await res.json().catch(() => ({})) as any;
        const msg = (err?.error?.message ?? `HTTP ${res.status}`).slice(0, 100);
        push({ provider: "Gemini", model, status: "fail", latencyMs: ms, error: msg, httpStatus: res.status });
        console.log(`  ${badge(false)}  ${pad(model, 30)}  HTTP ${res.status}  –  ${msg}`);
      }
    } catch (e: any) {
      const ms = Date.now() - t0;
      push({ provider: "Gemini", model, status: "fail", latencyMs: ms, error: e.message });
      console.log(`  ${badge(false)}  ${pad(model, 30)}  NETWORK ERROR  –  ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Provider: OpenAI / GPT
// ---------------------------------------------------------------------------
async function testOpenAI(key: string): Promise<void> {
  console.log("\n🟩 Testing OpenAI (GPT)...");
  const models = ["gpt-4o-mini", "gpt-3.5-turbo", "gpt-4o"];

  for (const model of models) {
    const t0 = Date.now();
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: PROMPT }],
          max_tokens: MAX_TOKENS,
          temperature: 0.1,
        }),
      });
      const ms = Date.now() - t0;
      if (res.ok) {
        const data = await res.json() as any;
        const text = (data?.choices?.[0]?.message?.content ?? "").trim();
        push({ provider: "OpenAI", model, status: "pass", latencyMs: ms, response: text, httpStatus: res.status });
        console.log(`  ${badge(true)}  ${pad(model, 30)}  ${ms}ms  →  "${text.slice(0, 60)}"`);
      } else {
        const err = await res.json().catch(() => ({})) as any;
        const msg = (err?.error?.message ?? `HTTP ${res.status}`).slice(0, 100);
        push({ provider: "OpenAI", model, status: "fail", latencyMs: ms, error: msg, httpStatus: res.status });
        console.log(`  ${badge(false)}  ${pad(model, 30)}  HTTP ${res.status}  –  ${msg}`);
      }
    } catch (e: any) {
      const ms = Date.now() - t0;
      push({ provider: "OpenAI", model, status: "fail", latencyMs: ms, error: e.message });
      console.log(`  ${badge(false)}  ${pad(model, 30)}  NETWORK ERROR  –  ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Provider: Groq  (OpenAI-compatible, ultra-fast, generous free tier)
// ---------------------------------------------------------------------------
async function testGroq(key: string): Promise<void> {
  console.log("\n🟧 Testing Groq (last resort)...");
  const models = [
    "llama-3.3-70b-versatile",   // ✅ confirmed working
    "llama-3.1-8b-instant",      // ✅ confirmed working
  ];

  for (const model of models) {
    const t0 = Date.now();
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: PROMPT }],
          max_tokens: MAX_TOKENS,
          temperature: 0.1,
        }),
      });
      const ms = Date.now() - t0;
      if (res.ok) {
        const data = await res.json() as any;
        const text = (data?.choices?.[0]?.message?.content ?? "").trim();
        push({ provider: "Groq", model, status: "pass", latencyMs: ms, response: text, httpStatus: res.status });
        console.log(`  ${badge(true)}  ${pad(model, 35)}  ${ms}ms  →  "${text.slice(0, 60)}"`);
      } else {
        const retryAfter = res.headers.get("retry-after") ?? res.headers.get("Retry-After");
        const err = await res.json().catch(() => ({})) as any;
        const msg = (err?.error?.message ?? `HTTP ${res.status}`).slice(0, 100);
        push({ provider: "Groq", model, status: "fail", latencyMs: ms, error: msg, httpStatus: res.status });
        console.log(
          `  ${badge(false)}  ${pad(model, 35)}  HTTP ${res.status}` +
          `${retryAfter ? ` (retry-after: ${retryAfter}s)` : ""}  –  ${msg}`
        );
      }
    } catch (e: any) {
      const ms = Date.now() - t0;
      push({ provider: "Groq", model, status: "fail", latencyMs: ms, error: e.message });
      console.log(`  ${badge(false)}  ${pad(model, 35)}  NETWORK ERROR  –  ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Full fallback chain simulation  Gemini → GPT → Groq
// ---------------------------------------------------------------------------
async function testFallbackChain(): Promise<void> {
  console.log("\n🔗 Testing full fallback chain: Gemini → GPT → Groq");

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.GPT_API_KEY || process.env.OPENAI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY || process.env.GROK_KEY;

  let resolved = false;

  // 1. Gemini
  if (geminiKey && !resolved) {
    for (const model of ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"]) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }], generationConfig: { maxOutputTokens: MAX_TOKENS } }),
          }
        );
        if (res.ok) {
          const data = await res.json() as any;
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`  ✅ Chain resolved via  Gemini  (${model}):  "${text.trim().slice(0, 70)}"`);
            resolved = true;
            break;
          }
        }
      } catch { /* try next */ }
    }
  }

  // 2. GPT
  if (openaiKey && !resolved) {
    for (const model of ["gpt-4o-mini", "gpt-3.5-turbo"]) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: [{ role: "user", content: PROMPT }], max_tokens: MAX_TOKENS }),
        });
        if (res.ok) {
          const data = await res.json() as any;
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            console.log(`  ✅ Chain resolved via  GPT  (${model}):  "${text.trim().slice(0, 70)}"`);
            resolved = true;
            break;
          }
        }
      } catch { /* try next */ }
    }
  }

  // 3. Groq
  if (groqKey && !resolved) {
    for (const model of ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: [{ role: "user", content: PROMPT }], max_tokens: MAX_TOKENS }),
        });
        if (res.ok) {
          const data = await res.json() as any;
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            console.log(`  ✅ Chain resolved via  Groq  (${model}):  "${text.trim().slice(0, 70)}"`);
            resolved = true;
            break;
          }
        }
      } catch { /* try next */ }
    }
  }

  if (!resolved) {
    console.log("  ❌ Fallback chain EXHAUSTED – all providers failed.");
    console.log("     → Check API keys/quotas in .env and restart the servers.");
  }
}

// ---------------------------------------------------------------------------
// Live API server health check
// ---------------------------------------------------------------------------
async function testAPIEndpoints(): Promise<void> {
  console.log("\n🌐 Testing live API server endpoints...");

  const endpoints = [
    { label: "API root",             url: "http://localhost:5001/",                          expect: 200 },
    { label: "Dashboard analytics",  url: "http://localhost:5001/api/analytics/dashboard",   expect: 200 },
    { label: "Revenue analytics",    url: "http://localhost:5001/api/analytics/revenue",      expect: 200 },
    { label: "Projects list",        url: "http://localhost:5001/api/projects",               expect: 200 },
    { label: "Clients list",         url: "http://localhost:5001/api/clients",                expect: 200 },
    { label: "Invoices list",        url: "http://localhost:5001/api/invoices",               expect: 200 },
    { label: "Resources list",       url: "http://localhost:5001/api/resources",              expect: 200 },
    { label: "Tasks list",           url: "http://localhost:5001/api/tasks",                  expect: 200 },
    { label: "Notifications",        url: "http://localhost:5001/api/notifications",          expect: 200 },
    { label: "Resources summary",    url: "http://localhost:5001/api/resources/summary",      expect: 200 },
    { label: "AI server health",     url: "http://localhost:5050/health",                     expect: 200 },
  ];

  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const res = await fetch(ep.url, { signal: AbortSignal.timeout(5000) });
      const ms = Date.now() - t0;
      const ok = res.status === ep.expect;
      let preview = "";
      if (res.ok) {
        const raw = await res.text();
        preview = raw.slice(0, 90).replace(/\n/g, " ");
      }
      console.log(
        `  ${badge(ok)}  ${pad(ep.label, 26)}  HTTP ${res.status}  ${ms}ms` +
        (preview ? `  ${preview}` : "")
      );
    } catch (e: any) {
      const ms = Date.now() - t0;
      console.log(`  ${badge(false)}  ${pad(ep.label, 26)}  NETWORK ERROR  ${ms}ms  –  ${e.message}`);
    }
  }

  // Chat endpoint (POST)
  console.log("\n  ─── Chat endpoint (POST /api/chat) ───");
  const t0 = Date.now();
  try {
    const res = await fetch("http://localhost:5001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Ping. Reply with: PONG" }),
      signal: AbortSignal.timeout(30000),
    });
    const ms = Date.now() - t0;
    const data = await res.json() as any;
    const ok = res.ok && !!data?.reply;
    console.log(
      `  ${badge(ok)}  ${pad("Chat /api/chat", 26)}  HTTP ${res.status}  ${ms}ms  →  "${(data?.reply ?? data?.error ?? "").slice(0, 80)}"`
    );
  } catch (e: any) {
    console.log(`  ${badge(false)}  ${pad("Chat /api/chat", 26)}  NETWORK ERROR  –  ${(e as Error).message}`);
  }

  // Pricing estimate (POST)
  console.log("\n  ─── Pricing estimate (POST /api/pricing/estimate) ───");
  const t1 = Date.now();
  try {
    const res = await fetch("http://localhost:5001/api/pricing/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Simple todo app with user login", clientType: "startup", timeline: "1 month" }),
      signal: AbortSignal.timeout(30000),
    });
    const ms = Date.now() - t1;
    const data = await res.json() as any;
    const ok = res.ok && !!data?.totalEstimate;
    console.log(
      `  ${badge(ok)}  ${pad("POST /pricing/estimate", 26)}  HTTP ${res.status}  ${ms}ms` +
      (ok ? `  totalEstimate: ₹${data.totalEstimate?.toLocaleString("en-IN")}` : `  ${JSON.stringify(data).slice(0, 80)}`)
    );
  } catch (e: any) {
    console.log(`  ${badge(false)}  ${pad("POST /pricing/estimate", 26)}  NETWORK ERROR  –  ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
function printSummary(): void {
  console.log("\n" + "═".repeat(80));
  console.log("📊  TEST SUMMARY");
  console.log("═".repeat(80));

  for (const provider of ["Gemini", "OpenAI", "Groq"]) {
    const pResults = results.filter(r => r.provider === provider);
    if (!pResults.length) continue;
    const passed = pResults.filter(r => r.status === "pass");
    const failed = pResults.filter(r => r.status === "fail");
    console.log(`\n  ${provider}`);
    console.log(`    Passed  : ${passed.length} / ${pResults.length}`);
    if (passed.length) {
      const avg = Math.round(passed.reduce((s, r) => s + r.latencyMs, 0) / passed.length);
      console.log(`    Avg ms  : ${avg}`);
      console.log(`    Working : ${passed.map(r => r.model).join(", ")}`);
    }
    if (failed.length) {
      console.log(`    Failed  : ${failed.map(r => `${r.model} (${r.httpStatus ?? "net"})`).join(", ")}`);
    }
  }

  const anyWorking = results.some(r => r.status === "pass");
  console.log("\n" + "═".repeat(80));
  console.log(
    anyWorking
      ? "✅  At least one LLM provider is working – fallback chain will function."
      : "❌  NO LLM providers are working. Update API keys / wait for quota reset."
  );
  console.log(
    "\n  Fallback order: Gemini → GPT → Groq\n" +
    "  Keys file     : .env\n"
  );
  console.log("═".repeat(80) + "\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("═".repeat(80));
  console.log("🚀  Nexus AI – LLM Provider Test Suite");
  console.log("    Fallback order: Gemini → GPT → Groq");
  console.log("═".repeat(80));

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.GPT_API_KEY || process.env.OPENAI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY || process.env.GROK_KEY;

  console.log("\n📋  API keys from .env:");
  console.log(`  GEMINI_API_KEY : ${geminiKey  ? "✅ " + geminiKey.slice(0, 10)  + "..." : "❌ NOT SET"}`);
  console.log(`  GPT_API_KEY    : ${openaiKey  ? "✅ " + openaiKey.slice(0, 10)  + "..." : "❌ NOT SET"}`);
  console.log(`  GROQ_API_KEY   : ${groqKey    ? "✅ " + groqKey.slice(0, 10)    + "..." : "❌ NOT SET"}`);

  if (geminiKey)  await testGemini(geminiKey);
  else            console.log("\n⏭️   Skipping Gemini – key not set");

  if (openaiKey)  await testOpenAI(openaiKey);
  else            console.log("\n⏭️   Skipping OpenAI – key not set");

  if (groqKey)    await testGroq(groqKey);
  else            console.log("\n⏭️   Skipping Groq – key not set");

  await testFallbackChain();
  await testAPIEndpoints();

  printSummary();
}

main().catch(console.error);
