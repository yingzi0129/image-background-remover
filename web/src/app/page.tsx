"use client";

import { useMemo, useState } from "react";

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

  function onPick(f: File | null) {
    if (!f) return;
    // basic client-side guard
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      setError("请上传 PNG 或 JPG 图片");
      setFile(null);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("图片太大，请上传 10MB 以内的图片");
      setFile(null);
      return;
    }
    setError("");
    setResultUrl("");
    setStatus("idle");
    setFile(f);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              MVP · remove.bg
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Image Background Remover
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              上传图片，一键去除背景并下载透明 PNG。我们不存储图片，全部在内存中处理。
            </p>
          </div>

          <div className="hidden md:block">
            <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
              <div className="font-medium text-slate-900">Tips</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>建议 1:1 或主体居中图片</li>
                <li>最大 10MB，支持 PNG/JPG</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload card */}
        <section className="mt-10 grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">上传图片</div>
                <button
                  onClick={reset}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  重置
                </button>
              </div>

              <label
                className={
                  "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition " +
                  (dragOver
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100")
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-6 w-6 text-slate-700"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 10l5-5 5 5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14"
                    />
                  </svg>
                </div>

                <div className="mt-3 text-sm font-medium">
                  拖拽图片到这里，或点击选择
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  PNG / JPG，最大 10MB
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => onPick(e.target.files?.[0] || null)}
                />
              </label>

              {file ? (
                <div className="mt-4 rounded-xl border bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium leading-5">
                        {file.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {file.type} · {formatBytes(file.size)}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      Ready
                    </span>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={onSubmit}
                  disabled={!file || status === "uploading"}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-40"
                >
                  {status === "uploading" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      处理中…
                    </>
                  ) : (
                    <>开始去背景</>
                  )}
                </button>

                <button
                  onClick={reset}
                  className="rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  清空
                </button>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                去背景由 remove.bg 提供。请勿上传敏感信息。
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="md:col-span-3">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-sm font-medium">原图预览</div>
                {inputUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inputUrl}
                    alt="input"
                    className="mt-4 aspect-square w-full rounded-xl object-contain bg-slate-50"
                  />
                ) : (
                  <div className="mt-4 flex aspect-square w-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                    请选择图片
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-sm font-medium">结果（透明 PNG）</div>
                {resultUrl ? (
                  <>
                    <div className="mt-4 rounded-xl bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resultUrl}
                        alt="result"
                        className="aspect-square w-full rounded-lg object-contain"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <a
                        href={resultUrl}
                        download="removed-bg.png"
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                      >
                        下载 PNG
                      </a>
                      <div className="text-xs text-slate-500">
                        建议下载后再做二次压缩/裁剪。
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 flex aspect-square w-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                    {status === "uploading" ? "处理中…" : "等待生成"}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border bg-white p-5 text-sm text-slate-600 shadow-sm">
              <div className="font-medium text-slate-900">隐私与说明</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>图片不落盘、不存储，仅在请求链路中处理。</li>
                <li>如接口返回失败，可能是 remove.bg 配额不足或密钥未配置。</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
