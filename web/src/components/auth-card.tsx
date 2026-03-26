"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  email?: string;
  name?: string;
  avatar_url?: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M9 7.364v3.49h4.844c-.213 1.121-.852 2.07-1.81 2.709l2.927 2.273c1.705-1.571 2.689-3.883 2.689-6.636 0-.639-.057-1.253-.164-1.836H9Z"
      />
      <path
        fill="#4285F4"
        d="M9 18c2.43 0 4.469-.803 5.958-2.164l-2.927-2.273c-.803.54-1.831.86-3.031.86-2.33 0-4.304-1.573-5.01-3.687H.965v2.346A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.99 10.736A5.41 5.41 0 0 1 3.71 9c0-.603.106-1.188.28-1.736V4.918H.965A9 9 0 0 0 0 9c0 1.446.344 2.816.965 4.082l3.025-2.346Z"
      />
      <path
        fill="#34A853"
        d="M9 3.577c1.32 0 2.5.454 3.433 1.344l2.576-2.576C13.465.908 11.427 0 9 0A9 9 0 0 0 .965 4.918L3.99 7.264C4.696 5.15 6.67 3.577 9 3.577Z"
      />
    </svg>
  );
}

export function AuthCard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="inline-flex h-8 items-center rounded-full bg-white/8 px-3 text-xs text-white/60 ring-1 ring-white/10 backdrop-blur">
        Checking…
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/api/auth/google/login"
        className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-xs font-medium text-slate-900 shadow-sm transition hover:bg-white/90"
      >
        <GoogleIcon />
        <span>继续使用 Google</span>
      </a>
    );
  }

  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-full bg-white/10 px-2 pr-3 text-xs text-white ring-1 ring-white/15 backdrop-blur">
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar_url} alt={user.name || "avatar"} className="h-6 w-6 rounded-full" />
      ) : (
        <div className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[10px]">U</div>
      )}
      <span className="max-w-[120px] truncate">{user.name || user.email || "已登录"}</span>
      <a href="/api/auth/logout" className="text-white/70 hover:text-white">
        退出
      </a>
    </div>
  );
}
