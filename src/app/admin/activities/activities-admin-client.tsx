"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteActivity, setActivityActive, upsertActivity } from "@/lib/actions/admin";
import type { AdminActivityRow } from "@/lib/queries/admin";
import type { UpsertActivityInput } from "@/lib/validation/admin.schema";

const CATEGORIES = ["mobility", "walking", "hydration", "strength", "posture", "eye-care", "breathing", "sleep"] as const;
const DIFFICULTIES = ["easy", "moderate", "challenging"] as const;
const POSITIONS = ["standing", "seated", "either"] as const;

const emptyForm = (): UpsertActivityInput => ({
  slug: "",
  title: "",
  category: "mobility",
  difficulty: "easy",
  minutes: 5,
  xpValue: 10,
  position: "either",
  summary: "",
  isActive: true,
});

export function ActivitiesAdminClient({ activities }: { activities: AdminActivityRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<UpsertActivityInput | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminActivityRow | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleActive(activityId: string, isActive: boolean) {
    startTransition(async () => {
      await setActivityActive({ activityId, isActive });
      router.refresh();
    });
  }

  function handleDelete(activityId: string) {
    startTransition(async () => {
      await deleteActivity({ activityId });
      setConfirmDelete(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-muted-foreground">Activities ({activities.length})</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing(emptyForm())}>
          <Plus className="h-4 w-4" aria-hidden />
          New activity
        </Button>
      </div>

      {editing && (
        <ActivityForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <div className="flex flex-col gap-2">
        {activities.map((a) => (
          <Card key={a.id} className="flex items-center justify-between gap-3 p-3.5">
            <button
              type="button"
              className="flex-1 text-left"
              onClick={() =>
                setEditing({
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  category: a.category as UpsertActivityInput["category"],
                  difficulty: a.difficulty as UpsertActivityInput["difficulty"],
                  minutes: a.minutes,
                  xpValue: a.xp_value,
                  position: a.position as UpsertActivityInput["position"],
                  summary: a.summary,
                  isActive: a.is_active,
                })
              }
            >
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.category} · {a.difficulty} · {a.minutes}min · {a.xp_value}xp
              </p>
            </button>
            <Badge variant={a.is_active ? "default" : "muted"}>{a.is_active ? "Active" : "Inactive"}</Badge>
            <Switch
              checked={a.is_active}
              onCheckedChange={(v) => toggleActive(a.id, v)}
              label={`Toggle ${a.title} active`}
              disabled={pending}
            />
            <Button
              size="icon"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirmDelete(a)}
              aria-label={`Delete ${a.title}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={`Delete "${confirmDelete?.title}"?`}
        description="This can't be undone."
        confirmLabel="Delete"
        pending={pending}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
      />
    </div>
  );
}

function ActivityForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: UpsertActivityInput;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof UpsertActivityInput>(key: K, value: UpsertActivityInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await upsertActivity(form);
      if (result.ok) {
        onSaved();
      } else {
        setError(result.message ?? "Couldn't save.");
      }
    });
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Title
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Slug
          <input
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            disabled={!!form.id}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Summary
        <textarea
          value={form.summary}
          onChange={(e) => update("summary", e.target.value)}
          rows={2}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SelectField label="Category" value={form.category} options={CATEGORIES} onChange={(v) => update("category", v)} />
        <SelectField label="Difficulty" value={form.difficulty} options={DIFFICULTIES} onChange={(v) => update("difficulty", v)} />
        <SelectField label="Position" value={form.position} options={POSITIONS} onChange={(v) => update("position", v)} />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Minutes
          <input
            type="number"
            min={1}
            max={60}
            value={form.minutes}
            onChange={(e) => update("minutes", Number(e.target.value))}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        XP value
        <input
          type="number"
          min={1}
          max={200}
          value={form.xpValue}
          onChange={(e) => update("xpValue", Number(e.target.value))}
          className="w-32 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="flex items-center gap-2">
        <Switch checked={form.isActive} onCheckedChange={(v) => update("isActive", v)} label="Active" />
        <span className="text-sm text-muted-foreground">Active (eligible for daily plans)</span>
      </div>

      {error && (
        <p role="alert" className="text-xs text-[hsl(var(--warning))]">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" disabled={pending || form.title.trim().length < 2 || form.slug.trim().length < 2} onClick={handleSave}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <Select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </label>
  );
}
