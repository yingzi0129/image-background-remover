"use client";

import { useMemo, useState } from "react";
import { getDict, type Lang } from "@/lib/i18n";

type Status = "idle" | "uploading" | "done" | "error";

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = useMemo(() => getDict(lang), [lang]);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  const inputUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  async function onSubmit() {
    if (!file) return;
    setStatus("uploading");
    setError("");
    setResultUrl("");

    const form = new FormData();
    form.append("image", file);

    try {
      const resp = await fetch("/api/remove-bg", {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("done");
    } catch (e: any) {
      setError(e?.message || "Request failed");
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setStatus("idle");
    setError("");
    setResultUrl("");
  }

  function onPick(f: File | null) {
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      setError(t.errType);
      setFile(null);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(t.errSize);
      setFile(null);
      return;
    }
    setError("");
    setResultUrl("");
    setStatus("idle");
    setFile(f);
  }

  const hasInput = !!inputUrl;
  const hasOutput = !!resultUrl;

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/25 blur-[90px]" />
        <div className="absolute -right-40 top-40 h-[560px] w-[560px] rounded-full bg-cyan-400/20 blur-[110px]" />
        <div className="absolute left-1/2 top-[55%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-black/40" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur grid place-items-center">
              <span className="text-sm font-semibold">IB</span>
            </div>
            <div>
              <div className="text-sm font-medium text-white/90">{t.brand}</div>
              <div className="text-xs text-white/60">{t.tagline}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/15">
                {t.chipNoStorage}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/15">
                {t.chipLimit}
              </span>
            </div>

            <button
              onClick={() => setLang((v) => (v === "zh" ? "en" : "zh"))}
              className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15 hover:bg-white/15"
              aria-label="toggle language"
              title="中文 / English"
            >
              {lang === "zh" ? "EN" : "中文"}
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.heroTitle1}
              <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                {t.heroTitle2}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
              {t.heroDesc}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
                <div className="text-white/80">{t.featureFastTitle}</div>
                <div className="text-xs text-white/60">{t.featureFastDesc}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
                <div className="text-white/80">{t.featurePrivacyTitle}</div>
                <div className="text-xs text-white/60">{t.featurePrivacyDesc}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
                <div className="text-white/80">{t.featureQualityTitle}</div>
                <div className="text-xs text-white/60">{t.featureQualityDesc}</div>
              </div>
            </div>
          </div>

          {/* Upload card */}
          <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t.upload}</div>
              <button onClick={reset} className="text-xs text-white/60 hover:text-white">
                {t.reset}
              </button>
            </div>

            <label
              className={
                "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/5 p-6 text-center transition " +
                (dragOver ? "border-emerald-300/60 bg-emerald-300/10" : "hover:bg-white/10")
              }
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0] || null;
                onPick(f);
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-6 w-6 text-white/90"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5-5 5 5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
                </svg>
              </div>

              <div className="mt-3 text-sm font-medium text-white/90">{t.dropTitle}</div>
              <div className="mt-1 text-xs text-white/60">{t.dropHint}</div>

              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => onPick(e.target.files?.[0] || null)} />
            </label>

            {file ? (
              <div className="mt-4 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium leading-5">{file.name}</div>
                    <div className="mt-1 text-xs text-white/60">
                      {file.type} · {formatBytes(file.size)}
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 ring-1 ring-white/15">
                    {t.ready}
                  </span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-4 flex gap-3">
              <button
                onClick={onSubmit}
                disabled={!file || status === "uploading"}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:opacity-95 disabled:opacity-40"
              >
                {status === "uploading" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/20 border-t-slate-950" />
                    {t.processing}
                  </>
                ) : (
                  <>{t.btnRemove}</>
                )}
              </button>

              <button
                onClick={reset}
                className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white/80 ring-1 ring-white/15 hover:bg-white/15"
              >
                {t.btnClear}
              </button>
            </div>

            <div className="mt-3 text-xs text-white/55">{t.legal}</div>
          </div>
        </div>

        {/* Output section */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t.inputPreview}</div>
              <div className="text-xs text-white/60">{hasInput ? t.ready : "—"}</div>
            </div>
            {hasInput ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={inputUrl} alt="input" className="mt-4 h-[420px] w-full rounded-2xl bg-white/5 object-contain" />
            ) : (
              <div className="mt-4 grid h-[420px] place-items-center rounded-2xl bg-white/5 text-sm text-white/50">
                {t.inputPlaceholder}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t.outputPreview}</div>
              <div className="text-xs text-white/60">
                {status === "uploading" ? t.processing : hasOutput ? "OK" : "—"}
              </div>
            </div>

            {hasOutput ? (
              <>
                <div className="mt-4 rounded-2xl bg-[linear-gradient(45deg,rgba(255,255,255,0.10)_25%,transparent_25%),linear-gradient(-45deg,rgba(255,255,255,0.10)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(255,255,255,0.10)_75%),linear-gradient(-45deg,transparent_75%,rgba(255,255,255,0.10)_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="result" className="h-[420px] w-full rounded-xl object-contain" />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={resultUrl}
                    download="removed-bg.png"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                  >
                    {t.download}
                  </a>
                  <div className="text-xs text-white/55">{t.tip}</div>
                </div>
              </>
            ) : (
              <div className="mt-4 grid h-[420px] place-items-center rounded-2xl bg-white/5 text-sm text-white/50">
                {status === "uploading" ? t.processing : t.outputPlaceholder}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-10 text-xs text-white/50">© {new Date().getFullYear()} · Next.js + Tailwind</footer>
      </div>
    </main>
  );
}
