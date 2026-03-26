"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  email?: string;
  name?: string;
  avatar_url?: string;
};

export function AuthCard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70 ring-1 ring-white/15">Checking sign-in…</div>;
  }

  if (!user) {
    return (
      <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
        <div className="text-sm font-medium text-white">Sign in to save your account profile</div>
        <div className="mt-1 text-xs text-white/60">Google OAuth + Cloudflare D1 user storage</div>
        <a
          href="/api/auth/google/login"
          className="mt-3 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white/90"
        >
          Continue with Google
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
      <div className="flex items-center gap-3">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar_url} alt={user.name || 'avatar'} className="h-10 w-10 rounded-full ring-1 ring-white/20" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-sm text-white">U</div>
        )}
        <div>
          <div className="text-sm font-medium text-white">{user.name || 'Signed in'}</div>
          <div className="text-xs text-white/60">{user.email}</div>
        </div>
      </div>
      <a href="/api/auth/logout" className="mt-3 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/15 hover:bg-white/15">
        Sign out
      </a>
    </div>
  );
}
