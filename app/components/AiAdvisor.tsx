"use client";

import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADVISOR_HEADINGS } from "../lib/advisor";
import { CROPS } from "../lib/cropRules";
import type { FarmProfile } from "../lib/field-shift";

type Status = "idle" | "streaming" | "done" | "error";

const HEADINGS = new Set<string>(ADVISOR_HEADINGS.map((h) => h.toLowerCase()));

/** Renders the plain-text answer: known headings as h4, "- " lines as bullets. */
function Answer({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: number) => {
    if (bullets.length) {
      blocks.push(<ul key={`u${k}`}>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>);
      bullets = [];
    }
  };
  text.split("\n").forEach((raw, k) => {
    const line = raw.trim().replace(/^\*\*(.*)\*\*$/, "$1").replace(/^#+\s*/, "");
    if (!line) return flush(k);
    if (/^[-*•]\s+/.test(line)) return void bullets.push(line.replace(/^[-*•]\s+/, ""));
    flush(k);
    const heading = line.replace(/:$/, "");
    blocks.push(HEADINGS.has(heading.toLowerCase()) ? <h4 key={k}>{heading}</h4> : <p key={k}>{line}</p>);
  });
  flush(-1);
  return <>{blocks}</>;
}

export default function AiAdvisor({
  lat,
  lng,
  cropId,
  onCropChange,
  profile,
}: {
  lat: number;
  lng: number;
  cropId: string;
  onCropChange: (id: string) => void;
  profile: FarmProfile;
}) {
  const [question, setQuestion] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  // Abort on unmount, and clear the old answer when the field or crop changes.
  useEffect(() => () => ctrl.current?.abort(), []);
  useEffect(() => {
    ctrl.current?.abort();
    /* eslint-disable react-hooks/set-state-in-effect */
    setText("");
    setError("");
    setStatus("idle");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [lat, lng, cropId]);

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
        body: JSON.stringify({ lat, lng, cropId, question, profile }),
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
      if (!acc.trim()) throw new Error("The advisor returned an empty answer. Try again.");
      setStatus("done");
    } catch (err) {
      if (c.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const busy = status === "streaming";
  const crop = CROPS.find((c) => c.id === cropId) ?? CROPS[0];

  return (
    <section className="crop-check-card advisor-card" aria-labelledby="advisor-title">
      <div className="section-heading compact">
        <div>
          <h3 id="advisor-title">AI field advisor</h3>
          <p>Gemini reads the same NASA data, the crop check and your farm details.</p>
        </div>
        <span className="source-chip">Gemini · Vertex AI</span>
      </div>
      <form onSubmit={ask} className="advisor-form">
        <div className="field-label">
          <span>Crop</span>
          <Select name="advisor-crop" value={cropId} onValueChange={onCropChange}>
            <SelectTrigger className="shadcn-select"><SelectValue /></SelectTrigger>
            <SelectContent>{CROPS.map((cropOption) => <SelectItem key={cropOption.id} value={cropOption.id}>{cropOption.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className="field-label">
          Your question (optional)
          <input
            className="advisor-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            placeholder={`e.g. Is this a good time to plant ${crop.name.toLowerCase()} here?`}
          />
        </label>
        <div className="advisor-actions">
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? "Analysing…" : status === "idle" ? "Analyse this field" : "Ask again"}
          </button>
          {busy && (
            <button type="button" className="secondary-button"
              onClick={() => { ctrl.current?.abort(); setStatus(text ? "done" : "idle"); }}>
              Stop
            </button>
          )}
        </div>
      </form>

      {error && <p role="alert" className="advisor-error">{error}</p>}
      {text && <div className="advisor-answer" aria-live="polite"><Answer text={text} /></div>}
      {status !== "idle" && (
        <p className="advisor-note">
          AI-generated from NASA POWER data, the rule checks and your answers. It can be wrong. Confirm serious
          risks in the field and with a local agricultural officer.
        </p>
      )}
    </section>
  );
}
