"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  TextInput,
  Textarea,
  Select,
  Button,
  Checkbox,
} from "components/chds";
import {
  saveCmsSurfaceAction,
  publishCmsSurfaceAction,
  unpublishCmsSurfaceAction,
} from "lib/actions/cms";
import type { CmsSurface } from "lib/supabase/admin/cms";

type Version = { version: number; createdAt: string };

type SurfaceState = {
  title: string;
  subtitle: string;
  body: string;
  heroImageUrl: string;
  visibility: "draft" | "published";
  scheduledFor: string;
  seoTitle: string;
  seoDescription: string;
};

type Props = {
  surface: CmsSurface;
  initial: SurfaceState;
  versions: Version[];
};

export function CmsEditor({ surface, initial, versions }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SurfaceState>(initial);

  const update = <K extends keyof SurfaceState>(key: K, value: SurfaceState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const save = (publish: boolean) => {
    setError(null);
    startTransition(async () => {
      const payload = {
        title: state.title,
        subtitle: state.subtitle,
        body: state.body,
        heroImageUrl: state.heroImageUrl,
        visibility: publish ? "published" as const : state.visibility,
        scheduledFor: state.scheduledFor || null,
        seoTitle: state.seoTitle,
        seoDescription: state.seoDescription,
        sections: [],
      };
      const result = await saveCmsSurfaceAction(surface, payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (publish) {
        const pub = await publishCmsSurfaceAction(surface);
        if (!pub.ok) {
          setError(pub.error);
          return;
        }
        update("visibility", "published");
      }
      router.refresh();
    });
  };

  const togglePublish = () => {
    setError(null);
    startTransition(async () => {
      const action = state.visibility === "published" ? unpublishCmsSurfaceAction : publishCmsSurfaceAction;
      const result = await action(surface);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      update("visibility", state.visibility === "published" ? "draft" : "published");
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-[var(--ds-space-4)]">
        {error ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
            {error}
          </div>
        ) : null}

        <Field label="Title">
          <TextInput
            value={state.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Section title"
          />
        </Field>

        <Field label="Subtitle">
          <TextInput
            value={state.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="A short tagline"
          />
        </Field>

        <Field label="Hero image URL">
          <TextInput
            value={state.heroImageUrl}
            onChange={(e) => update("heroImageUrl", e.target.value)}
            placeholder="https://…"
          />
        </Field>

        <Field label="Body (rich text supported)">
          <Textarea
            value={state.body}
            onChange={(e) => update("body", e.target.value)}
            rows={20}
            placeholder="Full editorial copy, paragraphs, and headings"
          />
        </Field>

        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="SEO title">
            <TextInput
              value={state.seoTitle}
              onChange={(e) => update("seoTitle", e.target.value)}
            />
          </Field>
          <Field label="SEO description">
            <TextInput
              value={state.seoDescription}
              onChange={(e) => update("seoDescription", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Schedule (optional)">
          <TextInput
            type="datetime-local"
            value={state.scheduledFor}
            onChange={(e) => update("scheduledFor", e.target.value)}
          />
        </Field>

        <Field label="Visibility">
          <Select
            value={state.visibility}
            onChange={(e) => update("visibility", e.target.value as "draft" | "published")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>

        <div className="flex flex-wrap gap-[var(--ds-space-3)]">
          <Button variant="primary" disabled={pending} onClick={() => save(false)}>
            {pending ? "Saving…" : "Save draft"}
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => save(true)}>
            Save & publish
          </Button>
          <Button variant="ghost" disabled={pending} onClick={togglePublish}>
            {state.visibility === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <aside className="flex flex-col gap-[var(--ds-space-4)]">
        <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)]">
          <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            Preview status
          </h3>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            {state.visibility === "published" ? "Visible to customers" : "Hidden from customers"}
            {state.scheduledFor ? ` · scheduled ${state.scheduledFor}` : ""}
          </p>
        </div>
        <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)]">
          <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            Version history
          </h3>
          {versions.length === 0 ? (
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              No prior versions yet.
            </p>
          ) : (
            <ul className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
              {versions.map((v) => (
                <li
                  key={v.version}
                  className="flex items-center justify-between text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]"
                >
                  <span>v{v.version}</span>
                  <span className="text-[var(--ds-color-muted)]">
                    {new Date(v.createdAt).toLocaleString("en-NG")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
