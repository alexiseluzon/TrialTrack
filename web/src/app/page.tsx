import type { Metadata } from "next";

import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api";

export const metadata: Metadata = { title: "Dashboard" };

type TrialPage = { count: number };

export default async function DashboardPage() {
  const { count } = await apiGet<TrialPage>("/api/trials/?page_size=1");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">TrialTrack</h1>
        <SignOutButton />
      </header>
      <Card>
        <CardHeader>
          <CardDescription>Trials in registry</CardDescription>
          <CardTitle className="text-4xl">{count}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}