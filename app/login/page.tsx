"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email atau password salah.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-4 pt-24">
      <h1 className="font-display italic text-3xl mb-1">Agenda</h1>
      <p className="text-inksoft text-sm mb-8">Masuk untuk melihat jadwalmu.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-inksoft mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-paperline bg-white px-3 py-2.5 text-sm"
            placeholder="kamu@email.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-inksoft mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-paperline bg-white px-3 py-2.5 text-sm"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-red text-sm font-semibold">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink text-white font-bold py-3 text-sm disabled:opacity-60"
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
