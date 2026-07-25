"use client";

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[var(--ds-z-modal)]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200 motion-reduce:transition-none"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150 motion-reduce:transition-none"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200 motion-reduce:transition-none"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150 motion-reduce:transition-none"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={clsx(
                  "w-full max-w-lg rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)] shadow-[var(--ds-shadow-lg)]",
                  className,
                )}
              >
                {title ? (
                  <DialogTitle className="mb-[var(--ds-space-4)] text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    {title}
                  </DialogTitle>
                ) : null}
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}) {
  const enterFrom = side === "right" ? "translate-x-full" : "-translate-x-full";
  const leaveTo = side === "right" ? "translate-x-full" : "-translate-x-full";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[var(--ds-z-drawer)]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200 motion-reduce:transition-none"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150 motion-reduce:transition-none"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className={clsx("absolute inset-0 flex", side === "right" ? "justify-end" : "justify-start")}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200 motion-reduce:transition-none"
              enterFrom={enterFrom}
              enterTo="translate-x-0"
              leave="ease-in duration-150 motion-reduce:transition-none"
              leaveFrom="translate-x-0"
              leaveTo={leaveTo}
            >
              <DialogPanel
                className={clsx(
                  "h-full w-full max-w-md border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-lg)]",
                  className,
                )}
              >
                {title ? (
                  <div className="border-b border-[var(--ds-color-border)] px-[var(--ds-space-6)] py-[var(--ds-space-4)]">
                    <DialogTitle className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                      {title}
                    </DialogTitle>
                  </div>
                ) : null}
                <div className="h-full overflow-y-auto px-[var(--ds-space-6)] py-[var(--ds-space-6)]">
                  {children}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export function ConfirmationDialog({
  open,
  onClose,
  title,
  description,
  confirm,
  cancel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirm: React.ReactNode;
  cancel: React.ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description ? (
        <div className="mb-[var(--ds-space-6)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          {description}
        </div>
      ) : null}
      <div className="flex flex-wrap justify-end gap-[var(--ds-space-3)]">
        {cancel}
        {confirm}
      </div>
    </Modal>
  );
}

