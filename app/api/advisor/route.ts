// POST /api/advisor  { lat, lng, cropId, question?, profile? }  ->  streamed plain text
// Gemini on Vertex AI (express mode, API key in GEMINI_API_KEY) via the Vercel AI SDK.

import { createGoogleVertex } from "@ai-sdk/google-vertex";
import { streamText } from "ai";
import { ADVISOR_SYSTEM, buildAdvisorPrompt, farmContext } from "../../lib/advisor";
import { CROPS, evaluate } from "../../lib/cropRules";
import { fetchPowerDaily } from "../../lib/power";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_QUESTION = 500;

const vertex = createGoogleVertex({ apiKey: process.env.GEMINI_API_KEY });

const bad = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) return bad(500, "GEMINI_API_KEY is not set on the server.");

  let body: { lat?: unknown; lng?: unknown; cropId?: unknown; question?: unknown; profile?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad(400, "Expected a JSON body.");
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return bad(400, "Invalid lat/lng.");
  }
  const crop = CROPS.find((c) => c.id === body.cropId);
  if (!crop) return bad(400, "Unknown crop.");
  const question = typeof body.question === "string" ? body.question.trim().slice(0, MAX_QUESTION) : "";

  const now = new Date();
  let data;
  try {
    data = await fetchPowerDaily(lng, lat, 90, now, req.signal);
  } catch (e) {
    return bad(502, e instanceof Error ? e.message : "Couldn't reach NASA POWER.");
  }

  const result = streamText({
    model: vertex(MODEL),
    system: ADVISOR_SYSTEM,
    prompt: buildAdvisorPrompt({
      crop,
      data,
      alerts: evaluate(crop, data),
      today: now.toISOString().slice(0, 10),
      question: question || undefined,
      farm: farmContext(body.profile),
    }),
    maxOutputTokens: 4000, // Gemini 3 counts thinking tokens here
    abortSignal: req.signal,
    onError: ({ error }) => console.error("[advisor] Gemini error:", error),
  });

  return result.toTextStreamResponse({ headers: { "Cache-Control": "no-store" } });
}
