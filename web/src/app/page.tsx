"use client";

import { useMemo, useState } from "react";

type Status = "idle" | "uploading" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");

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
      setError(e?.message || "处理失败，请稍后重试");
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setStatus("idle");
    setError("");
    setResultUrl("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Image Background Remover</h1>
        <p className="mt-2 text-slate-600">
          上传图片，自动去除背景并下载透明 PNG。图片仅在内存中处理，不做存储。
        </p>

        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />

            <div className="flex gap-3">
              <button
                onClick={onSubmit}
                disabled={!file || status === "uploading"}
                className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40"
              >
                {status === "uploading" ? "处理中…" : "开始去背景"}
              </button>
              <button onClick={reset} className="rounded-lg border px-4 py-2">
                重置
              </button>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        {(inputUrl || resultUrl) && (
          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">原图</div>
              {inputUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={inputUrl} alt="input" className="mt-3 w-full rounded-lg" />
              ) : (
                <div className="mt-3 text-sm text-slate-500">未选择图片</div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">结果（透明 PNG）</div>
              {resultUrl ? (
                <>
                  <div className="mt-3 rounded-lg bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt="result" className="w-full rounded-lg" />
                  </div>
                  <a
                    href={resultUrl}
                    download="removed-bg.png"
                    className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-white"
                  >
                    下载 PNG
                  </a>
                </>
              ) : (
                <div className="mt-3 text-sm text-slate-500">等待生成结果</div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-12 text-xs text-slate-500">
          去背景由 remove.bg 提供。请勿上传敏感信息。
        </footer>
      </div>
    </main>
  );
}
