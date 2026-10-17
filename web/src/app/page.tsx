import type { Metadata } from "next";
import { Suspense } from "react";

import { Providers } from "@/components/providers";
import { SignOutButton } from "@/components/sign-out-button";
import { TrialRegistry } from "@/components/trial-registry";
import { apiGet } from "@/lib/api";

import { meSchema } from "@/lib/api-schemas";

export const metadata: Metadata = { title: "Registry" };



export default async function RegistryPage() {
  const me = await apiGet("/api/me/", meSchema);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TrialTrack</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {me.username}
            {me.is_staff ? " (admin)" : ""}
          </p>
        </div>
        <SignOutButton />
      </header>
      <Providers>
        <Suspense fallback={null}>
          <TrialRegistry isStaff={me.is_staff} />
        </Suspense>
      </Providers>
    </div>
  );
}