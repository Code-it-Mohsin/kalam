"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api-client";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signup(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      router.replace("/me");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={signup} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Join Kalam</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Create an account and start sharing your stories.
        </p>
      </div>

      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="name"
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button className="w-full" loading={loading} type="submit">
        Create account
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Already registered?{" "}
        <Link href="/auth/signin" className="font-semibold text-black">
          Sign in
        </Link>
      </p>
    </form>
  );
}