"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api-client";

export default function SigninPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await api("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      router.replace("/me");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Signin failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={signin} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Sign in to continue reading and writing.
        </p>
      </div>

      <Input
        label="Email or username"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
        autoComplete="username"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button className="w-full" loading={loading} type="submit">
        Sign in
      </Button>

      <div className="text-center text-sm text-neutral-500">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="font-semibold text-black">
          Sign up
        </Link>
      </div>

      <div className="relative py-2 text-center text-xs text-neutral-400">
        <span className="bg-white px-3">OR</span>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        type="button"
        onClick={() => {
          window.location.href = "/api/auth/google";
        }}
      >
        Continue with Google
      </Button>
    </form>
  );
}