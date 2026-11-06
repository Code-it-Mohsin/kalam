"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types-client";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ data: User }>("/api/me")
      .then((result) => setUser(result.data))
      .catch((error) =>
        setError(error instanceof Error ? error.message : "Unable to load profile")
      );
  }, []);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: user.name,
          bio: user.bio,
          image: user.image,
        }),
      });

      setMessage("Profile updated successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await api("/api/me/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
        }),
      });

      setPassword("");
      setNewPassword("");
      setMessage("Password changed successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Password change failed");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <p className="text-sm text-neutral-500">{error || "Loading..."}</p>;
  }

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage your profile and account.
        </p>
      </div>

      <form onSubmit={updateProfile} className="space-y-5">
        <h2 className="text-xl font-semibold">Profile information</h2>

        <Input
          label="Username"
          value={user.username}
          disabled
        />

        <Input
          label="Display name"
          value={user.name || ""}
          onChange={(e) =>
            setUser({ ...user, name: e.target.value })
          }
        />

        <Input
          label="Profile image URL"
          value={user.image || ""}
          onChange={(e) =>
            setUser({ ...user, image: e.target.value })
          }
        />

        <Textarea
          label="Bio"
          rows={4}
          value={user.bio || ""}
          onChange={(e) =>
            setUser({ ...user, bio: e.target.value })
          }
        />

        <Button loading={loading} type="submit">
          Save changes
        </Button>
      </form>

      <form onSubmit={changePassword} className="space-y-5 border-t pt-8">
        <h2 className="text-xl font-semibold">Change password</h2>

        <Input
          label="Current password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />

        <Button loading={loading} type="submit">
          Change password
        </Button>
      </form>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}