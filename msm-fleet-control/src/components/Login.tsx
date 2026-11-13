
"use client";

import { FormEvent, useState } from "react";

export default function Login({
  onLogin,
}: {
  onLogin: (username: string, password: string) => Promise<string | null>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await onLogin(username.trim(), password);
      if (result) setError(result);
    } catch {
      setError("Terjadi gangguan. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0B1F3A]">
            MSM Fleet Control
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Fleet Management System
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Username
          </label>
          <input
            className="inp w-full"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            className="inp w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          className="btn w-full"
          type="submit"
          disabled={busy || !username.trim() || !password}
        >
          {busy ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
