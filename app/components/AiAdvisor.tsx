"use client";

import { useEffect, useRef, useState } from "react";
import { ADVISOR_HEADINGS } from "../lib/advisor";

type Status = "idle" | "streaming" | "done" | "error";

const HEADINGS = new Set<string>(ADVISOR_HEADINGS.map((h) => h.toLowerCase()));

/** Renders the plain-text answer: known headings in bold, "- " lines as bullets. */
function Answer({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: number) => {
    if (bullets.length) {
      blocks.push(
        <ul key={`u${k}`} className="ml-4 list-disc">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };
  text.split("\n").forEach((raw, k) => {
    const line = raw.trim().replace(/^\*\*(.*)\*\*$/, "$1").replace(/^#+\s*/, "");
    if (!line) return flush(k);
    if (/^[-*•]\s+/.test(line)) return void bullets.push(line.replace(/^[-*•]\s+/, ""));
    flush(k);
    const isHeading = HEADINGS.has(line.replace(/:$/, "").toLowerCase());
    blocks.push(
      isHeading ? (
        <h4 key={k} className="mt-2 font-semibold first:mt-0">{line.replace(/:$/, "")}</h4>
      ) : (
        <p key={k}>{line}</p>
      ),
    );
  });
  flush(-1);
  return <div className="flex flex-col gap-1">{blocks}</div>;
}

export default function AiAdvisor({ lat, lng, cropId, cropName }: { lat: number; lng: number; cropId: string; cropName: string }) {
  const [question, setQuestion] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  async function ask(e?: React.FormEvent) {
    e?.preventDefault();
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setText("");
    setError("");
    setStatus("streaming");
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, cropId, question }),
        signal: c.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? `Advisor returned ${res.status}`);
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += value;
        setText(acc);
      }
      if (!acc.trim()) throw new Error("The AI returned an empty answer. Try again.");
      setStatus("done");
    } catch (err) {
      if (c.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const busy = status === "streaming";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-violet-300 bg-violet-50/60 p-3 dark:border-violet-800 dark:bg-violet-950/40">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium">AI field advisor</h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Gemini · Vertex AI</span>
      </div>
      <form onSubmit={ask} className="flex flex-col gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder={`Optional: ask about your ${cropName.toLowerCase()} (e.g. "Is it safe to apply fertiliser this week?")`}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
          aria-label="Question for the AI advisor"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={busy}
            className="rounded-md bg-violet-700 px-3 py-1 font-medium text-white disabled:opacity-60 dark:bg-violet-600">
            {busy ? "Analysing…" : status === "idle" ? "Analyse this field" : "Ask again"}
          </button>
          {busy && (
            <button type="button" onClick={() => { ctrl.current?.abort(); setStatus(text ? "done" : "idle"); }}
              className="rounded-md border border-zinc-300 px-3 py-1 dark:border-zinc-600">
              Stop
            </button>
          )}
        </div>
      </form>

      {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
      {text && (
        <div aria-live="polite" className="text-zinc-800 dark:text-zinc-100">
          <Answer text={text} />
        </div>
      )}
      {status !== "idle" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          AI-generated from NASA POWER data and the rule alerts above. It can be wrong, so check in the field and
          with your extension officer before acting on serious risks.
        </p>
      )}
    </div>
  );
}
