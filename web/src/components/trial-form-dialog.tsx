"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, useSaveTrial, useSponsors, type Trial } from "@/lib/queries";
import { PHASES, PHASE_LABELS, STATUSES, STATUS_LABELS } from "@/lib/trial-params";
import { toFormValues, toPayload, trialFormSchema, type TrialFormValues } from "@/lib/trial-schema";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[invalid=true]:border-destructive";

const a11y = (id: string, message?: string) => ({
  "aria-invalid": !!message,
  "aria-describedby": message ? `${id}-error` : undefined,
});

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function TrialFormDialog({ trial, onClose }: { trial: Trial | null; onClose: () => void }) {
  const save = useSaveTrial();
  const sponsors = useSponsors();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isDirty },
  } = useForm<TrialFormValues>({
    resolver: zodResolver(trialFormSchema),
    mode: "onChange",
    defaultValues: toFormValues(trial),
  });

  const onSubmit = (values: TrialFormValues) =>
    save.mutate(
      { id: trial?.id, payload: toPayload(values) },
      {
        onSuccess: () => {
          toast.success(trial ? `Updated ${trial.code}` : "Trial created");
          onClose();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            const general = err.fields.non_field_errors?.[0];
              if (general) {
                toast.error(general);
                return;
              }
            let mapped = false;
            for (const [field, messages] of Object.entries(err.fields)) {
              if (field in values) {
                setError(field as keyof TrialFormValues, { message: messages[0] });
                mapped = true;
              }
            }
            toast.error(mapped ? "Fix the highlighted fields." : "Invalid input.");
          } else if (err instanceof ApiError && err.status === 403) {
            toast.error("Admin access required.");
          } else {
            toast.error("Could not save trial. Try again.");
          }
        },
      },
    );

  const canSubmit = isValid && !save.isPending && !sponsors.isPending && (!trial || isDirty);

  return (
    <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{trial ? `Edit ${trial.code}` : "New trial"}</DialogTitle>
          <DialogDescription>Fake demo data only. Do not enter real patient or trial information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field id="code" label="Code" error={errors.code?.message}>
            <Input
              id="code"
              placeholder="TT-00061"
              maxLength={20}
              readOnly={!!trial}
              className={trial ? "bg-muted" : undefined}
              {...a11y("code", errors.code?.message)}
              {...register("code")}
            />
          </Field>

          <Field id="title" label="Title" error={errors.title?.message}>
            <Input id="title" maxLength={300} {...a11y("title", errors.title?.message)} {...register("title")} />
          </Field>

          <Field id="condition" label="Condition" error={errors.condition?.message}>
            <Input
              id="condition"
              maxLength={200}
              {...a11y("condition", errors.condition?.message)}
              {...register("condition")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="phase" label="Phase" error={errors.phase?.message}>
              <select id="phase" className={SELECT_CLASS} {...a11y("phase", errors.phase?.message)} {...register("phase")}>
                <option value="">Select…</option>
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {PHASE_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="status" label="Status" error={errors.status?.message}>
              <select id="status" className={SELECT_CLASS} {...a11y("status", errors.status?.message)} {...register("status")}>
                <option value="">Select…</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="sponsor" label="Sponsor" error={errors.sponsor?.message}>
            {sponsors.isPending ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <select id="sponsor" className={SELECT_CLASS} {...a11y("sponsor", errors.sponsor?.message)} {...register("sponsor")}>
                <option value="">Select…</option>
                {sponsors.data?.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            {sponsors.isError && (
              <p role="alert" className="text-sm text-destructive">
                Could not load sponsors.{" "}
                <button type="button" className="underline" onClick={() => sponsors.refetch()}>
                  Retry
                </button>
              </p>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="start_date" label="Start date" error={errors.start_date?.message}>
              <Input id="start_date" type="date" {...a11y("start_date", errors.start_date?.message)} {...register("start_date")} />
            </Field>
            <Field id="enrollment" label="Enrollment" error={errors.enrollment?.message}>
              <Input
                id="enrollment"
                type="number"
                min={0}
                max={1000000}
                step={1}
                inputMode="numeric"
                {...a11y("enrollment", errors.enrollment?.message)}
                {...register("enrollment")}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {save.isPending && <Loader2 className="animate-spin" aria-hidden />}
              {save.isPending ? "Saving…" : trial ? "Save changes" : "Create trial"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}