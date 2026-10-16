"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useTrialDetail } from "@/lib/queries";
import { PHASE_LABELS } from "@/lib/trial-params";

export function TrialDetailSheet({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useTrialDetail(code);

  useEffect(() => {
    if (isError) toast.error("Could not load trial details.");
  }, [isError]);

  return (
    <Sheet open={code !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{data?.title ?? "Trial details"}</SheetTitle>
          <SheetDescription className="font-mono">{code}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {isError && (
            <div role="alert" className="flex items-center justify-between rounded-md border border-destructive/40 p-3 text-sm">
              <span>Could not load details.</span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {isPending && !isError && (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          )}

          {data && (
            <>
              <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={data.status} />
                </dd>
                <dt className="text-muted-foreground">Phase</dt>
                <dd>{PHASE_LABELS[data.phase] ?? data.phase}</dd>
                <dt className="text-muted-foreground">Condition</dt>
                <dd>{data.condition}</dd>
                <dt className="text-muted-foreground">Sponsor</dt>
                <dd>
                  {data.sponsor.name} ({data.sponsor.country})
                </dd>
                <dt className="text-muted-foreground">Start date</dt>
                <dd>{formatDate(data.startDate)}</dd>
                <dt className="text-muted-foreground">Enrollment</dt>
                <dd className="tabular-nums">{data.enrollment.toLocaleString("en-US")}</dd>
              </dl>

              <section aria-labelledby="sites-heading">
                <h3 id="sites-heading" className="mb-2 text-sm font-medium">
                  Sites ({data.sites.length})
                </h3>
                <ul className="divide-y rounded-md border text-sm">
                  {data.sites.map((site) => (
                    <li key={site.id} className="px-3 py-2">
                      <p className="font-medium">{site.name}</p>
                      <p className="text-muted-foreground">
                        {site.city}, {site.country}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}