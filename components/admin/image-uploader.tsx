"use client";

import {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { Button, Label } from "components/chds";
import {
  uploadProductImageAction,
  deleteProductImageAction,
  reorderProductImagesAction,
} from "lib/actions/product-images";
import type { ProductImage } from "lib/supabase/admin/product-images";

// ── Types ─────────────────────────────────────────────────────────

export type ImageUploaderHandle = {
  /** Upload all pending files for a given product (create mode). */
  uploadPending: (productId: string) => Promise<{ ok: boolean; error?: string }>;
};

type Props = {
  /** Set in edit mode; images load immediately. */
  productId?: string;
  /** Pre-loaded images (edit mode). */
  existingImages?: ProductImage[];
};

type PendingFile = {
  id: string;
  file: File;
  dataUrl: string;
  progress: "idle" | "uploading" | "done" | "error";
  error?: string;
};

// ── Helpers ───────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILES = 10;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

let _pendingId = 0;
const nextPendingId = () => `pending-${++_pendingId}`;

// ── Component ─────────────────────────────────────────────────────

export const ImageUploader = forwardRef<ImageUploaderHandle, Props>(
  function ImageUploader({ productId, existingImages = [] }, ref) {
    const [images, setImages] = useState<ProductImage[]>(existingImages);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragItemRef = useRef<number | null>(null);
    const dragOverIdxRef = useRef<number | null>(null);

    // Sync existingImages when they change (e.g. after revalidation)
    useEffect(() => {
      if (productId) {
        setImages(existingImages);
      }
    }, [existingImages, productId]);

    // ── File selection ─────────────────────────────────────────

    const addFiles = useCallback(async (files: FileList | File[]) => {
      const list = Array.from(files);
      const valid = list.filter((f) => ALLOWED_TYPES.has(f.type));
      if (valid.length === 0) {
        setError("Unsupported file type. Use JPG, PNG, WEBP, or GIF.");
        return;
      }
      if (pendingFiles.length + images.length + valid.length > MAX_FILES) {
        setError(`Max ${MAX_FILES} images allowed.`);
        return;
      }

      setError(null);
      const newPending: PendingFile[] = await Promise.all(
        valid.map(async (file) => ({
          id: nextPendingId(),
          file,
          dataUrl: await readFileAsDataUrl(file),
          progress: "idle" as const,
        }))
      );
      setPendingFiles((prev) => [...prev, ...newPending]);
    }, [pendingFiles.length, images.length]);

    const handleFileChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      [addFiles]
    );

    // ── Drag-and-drop (files) ──────────────────────────────────

    const handleDragOver = useCallback((e: DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
      },
      [addFiles]
    );

    // ── Upload pending files ───────────────────────────────────

    const uploadAll = useCallback(
      async (pid: string): Promise<{ ok: boolean; error?: string }> => {
        if (pendingFiles.length === 0) return { ok: true };
        setIsUploading(true);
        setError(null);

        let ok = true;
        let lastError: string | undefined;

        for (const pf of pendingFiles) {
          setPendingFiles((prev) =>
            prev.map((p) =>
              p.id === pf.id ? { ...p, progress: "uploading" } : p
            )
          );

          const result = await uploadProductImageAction(pid, {
            fileName: pf.file.name,
            fileType: pf.file.type,
            dataUrl: pf.dataUrl,
          });

          if (!result.ok) {
            const errorMsg = result.error;
            setPendingFiles((prev) =>
              prev.map((p) =>
                p.id === pf.id
                  ? { ...p, progress: "error" as const, error: errorMsg }
                  : p
              )
            );
            ok = false;
            lastError = errorMsg;
          } else if (result.data) {
            setPendingFiles((prev) =>
              prev.map((p) =>
                p.id === pf.id ? { ...p, progress: "done" } : p
              )
            );
            setImages((prev) => [
              ...prev,
              {
                id: result.data.id,
                productId: pid,
                imageUrl: result.data.url,
                path: result.data.path,
                altText: null,
                isHero: false,
                displayOrder: prev.length + 1,
                uploadedAt: new Date().toISOString(),
                uploadedBy: null,
              },
            ]);
          }
        }

        // Clean up done/error pending items after a short delay
        setTimeout(() => {
          setPendingFiles((prev) =>
            prev.filter((p) => p.progress !== "done" && p.progress !== "error")
          );
        }, 3000);

        setIsUploading(false);
        return { ok, error: lastError };
      },
      [pendingFiles]
    );

    // Expose uploadPending for create-mode parent
    useImperativeHandle(
      ref,
      () => ({
        uploadPending: uploadAll,
      }),
      [uploadAll]
    );

    // ── Edit-mode immediate upload ─────────────────────────────

    const handleEditUpload = useCallback(
      async (files: FileList | File[]) => {
        if (!productId) return;
        const list = Array.from(files);
        const valid = list.filter((f) => ALLOWED_TYPES.has(f.type));
        if (valid.length === 0) {
          setError("Unsupported file type. Use JPG, PNG, WEBP, or GIF.");
          return;
        }
        if (images.length + valid.length > MAX_FILES) {
          setError(`Max ${MAX_FILES} images allowed.`);
          return;
        }

        setError(null);
        setIsUploading(true);

        for (const file of valid) {
          const dataUrl = await readFileAsDataUrl(file);
          const result = await uploadProductImageAction(productId, {
            fileName: file.name,
            fileType: file.type,
            dataUrl,
          });

          if (!result.ok) {
            setError(result.error);
          } else if (result.data) {
            setImages((prev) => [
              ...prev,
              {
                id: result.data.id,
                productId,
                imageUrl: result.data.url,
                path: result.data.path,
                altText: null,
                isHero: false,
                displayOrder: prev.length,
                uploadedAt: new Date().toISOString(),
                uploadedBy: null,
              },
            ]);
          }
        }

        setIsUploading(false);
      },
      [productId, images.length]
    );

    const handleEditFileChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleEditUpload(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      [handleEditUpload]
    );

    const handleEditDrop = useCallback(
      (e: DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleEditUpload(e.dataTransfer.files);
      },
      [handleEditUpload]
    );

    // ── Delete ─────────────────────────────────────────────────

    const handleDelete = useCallback(
      async (imageId: string) => {
        // Optimistic removal
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        const result = await deleteProductImageAction(imageId);
        if (!result.ok) {
          setError(result.error);
          // Could re-fetch, but the page will revalidate on navigation
        }
      },
      []
    );

    const handleRemovePending = useCallback((pendingId: string) => {
      setPendingFiles((prev) => prev.filter((p) => p.id !== pendingId));
    }, []);

    // ── Drag reorder ───────────────────────────────────────────

    const handleReorderDragStart = useCallback(
      (index: number) => {
        dragItemRef.current = index;
      },
      []
    );

    const handleReorderDragOver = useCallback(
      (e: DragEvent, index: number) => {
        e.preventDefault();
        dragOverIdxRef.current = index;
      },
      []
    );

    const handleReorderDrop = useCallback(
      async (index: number) => {
        const from = dragItemRef.current;
        dragItemRef.current = null;
        dragOverIdxRef.current = null;
        if (from === null || from === index || from >= images.length) return;

        const reordered = [...images];
        const [moved] = reordered.splice(from, 1);
        if (!moved) return;
        reordered.splice(index, 0, moved);
        setImages(reordered);

        // Persist to backend
        if (productId) {
          const orderedIds = reordered.map((img) => img.id);
          await reorderProductImagesAction(productId, orderedIds);
        }
      },
      [images, productId]
    );

    // ── Render ─────────────────────────────────────────────────

    const isEdit = Boolean(productId);

    return (
      <div className="flex flex-col gap-[var(--ds-space-3)]">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={isEdit ? handleEditDrop : handleDrop}
          className={`relative rounded-[var(--ds-radius-md)] border-2 border-dashed p-[var(--ds-space-6)] text-center transition-colors ${
            dragOver
              ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)]/5"
              : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={isEdit ? handleEditFileChange : handleFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload images"
          />
          <div className="pointer-events-none flex flex-col items-center gap-[var(--ds-space-2)]">
            <svg
              className="size-8 text-[var(--ds-color-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
              Drag &amp; drop images here, or click to browse
            </p>
            <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              JPG, PNG, WEBP, GIF — max 8 MB each — up to {MAX_FILES} images
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
            {error}
          </div>
        ) : null}

        {/* Uploading indicator */}
        {isUploading && (
          <div className="flex items-center gap-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            <div className="size-4 animate-spin rounded-full border-2 border-[var(--ds-color-border)] border-t-[var(--ds-color-accent)]" />
            Uploading…
          </div>
        )}

        {/* Image grid */}
        {(images.length > 0 || pendingFiles.length > 0) && (
          <div className="grid grid-cols-2 gap-[var(--ds-space-3)] sm:grid-cols-3 lg:grid-cols-4">
            {/* Existing / uploaded images */}
            {images.map((img, idx) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleReorderDragStart(idx)}
                onDragOver={(e) => handleReorderDragOver(e, idx)}
                onDrop={() => handleReorderDrop(idx)}
                className="group relative aspect-square overflow-hidden rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]"
              >
                <img
                  src={img.imageUrl}
                  alt={img.altText ?? `Image ${idx + 1}`}
                  className="size-full object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center gap-[var(--ds-space-2)] bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {img.isHero && (
                    <span className="absolute left-[var(--ds-space-2)] top-[var(--ds-space-2)] rounded-full bg-[var(--ds-color-accent)] px-[var(--ds-space-2)] py-0.5 text-[10px] font-[var(--ds-font-weight-medium)] text-white">
                      Hero
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(img.id)}
                    className="rounded-full bg-white/90 p-1.5 text-[var(--ds-color-danger)] transition-colors hover:bg-white"
                    aria-label="Delete image"
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {/* Drag handle */}
                <div className="absolute bottom-[var(--ds-space-1)] left-[var(--ds-space-1)] rounded bg-black/50 px-[var(--ds-space-1)] py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {idx + 1}
                </div>
              </div>
            ))}

            {/* Pending files (create mode) */}
            {pendingFiles.map((pf) => (
              <div
                key={pf.id}
                className="relative aspect-square overflow-hidden rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]"
              >
                <img
                  src={pf.dataUrl}
                  alt="Pending upload"
                  className="size-full object-cover"
                />
                {/* Progress overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-[var(--ds-space-1)]">
                  {pf.progress === "idle" && (
                    <>
                      <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span className="text-[10px] text-white">Pending</span>
                    </>
                  )}
                  {pf.progress === "uploading" && (
                    <>
                      <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-[var(--ds-color-accent)]" />
                      <span className="text-[10px] text-white">Uploading</span>
                    </>
                  )}
                  {pf.progress === "done" && (
                    <span className="text-[10px] text-[var(--ds-color-success)]">
                      Done
                    </span>
                  )}
                  {pf.progress === "error" && (
                    <span className="text-[10px] text-[var(--ds-color-danger)]">
                      {pf.error ?? "Failed"}
                    </span>
                  )}
                </div>
                {pf.progress !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => handleRemovePending(pf.id)}
                    className="absolute right-[var(--ds-space-1)] top-[var(--ds-space-1)] rounded-full bg-black/50 p-[var(--ds-space-1)] text-white transition-colors hover:bg-black/70"
                    aria-label="Remove pending file"
                  >
                    <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && pendingFiles.length === 0 && (
          <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            No images yet. Upload some to make this product shine.
          </p>
        )}
      </div>
    );
  }
);
