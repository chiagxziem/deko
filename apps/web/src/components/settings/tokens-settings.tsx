import {
  Copy01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { copyToClipboard } from "@/lib/utils";
import { type TokenDialogPayload, useDialogStore } from "@/stores/dialog-store";

// Dummy data — replace with real API data when wiring
type Token = {
  id: string;
  name: string;
  preview: string;
  createdAt: string;
  lastUsedAt: string | null;
};

const DUMMY_TOKENS: Token[] = [
  {
    id: "1",
    name: "Production CI",
    preview: "deko_sk_••••••••••••ab12",
    createdAt: "2024-01-15",
    lastUsedAt: "2024-04-10",
  },
  {
    id: "2",
    name: "Local Dev",
    preview: "deko_sk_••••••••••••cd34",
    createdAt: "2024-02-20",
    lastUsedAt: "2024-04-15",
  },
  {
    id: "3",
    name: "Staging",
    preview: "deko_sk_••••••••••••ef56",
    createdAt: "2024-03-05",
    lastUsedAt: null,
  },
];

function formatDate(iso: string) {
  return format(new Date(iso), "MMM d, yyyy");
}

// ── Tokens Table Columns Section ────────────────────────────────────────────────

const columns: ColumnDef<Token>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    id: "preview",
    accessorKey: "preview",
    header: "Token",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.preview}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "lastUsedAt",
    header: "Last used",
    accessorFn: (row) => row.lastUsedAt,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.lastUsedAt ? (
          formatDate(row.original.lastUsedAt)
        ) : (
          <Badge variant="outline">Never</Badge>
        )}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => <TokenRowActions token={row.original} />,
  },
];

// ── Tokens Section ───────────────────────────────────────────────────────────

export function TokensSettings() {
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Tokens</h2>
          <p className="text-xs text-muted-foreground">
            Manage API tokens for this service.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openDialog({ type: "create-token" })}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={12} />
          Create token
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={DUMMY_TOKENS}
        emptyMessage="No tokens yet."
      />
    </div>
  );
}

// ── Create Token Dialog ──────────────────────────────────────────────────────

function CreateTokenDialogHost() {
  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const open = activeDialog?.type === "create-token";

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      // TODO: wire to POST /api/services/:id/tokens
      await new Promise((r) => setTimeout(r, 600));
      // Dummy generated token
      setRevealedToken(
        `deko_sk_${"x".repeat(32)}${value.name.slice(0, 4).toLowerCase().replace(/\s/g, "_")}`,
      );
    },
  });

  function handleClose() {
    closeDialog();
    setRevealedToken(null);
    form.reset();
  }

  return (
    <>
      <Dialog
        open={open && !revealedToken}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleClose();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create token</DialogTitle>
            <DialogDescription>
              Give this token a name so you can identify it later.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const res = z
                      .string()
                      .min(1, "Name is required")
                      .max(64, "Name must be 64 characters or fewer")
                      .safeParse(value);
                    return res.success
                      ? undefined
                      : res.error.issues[0]?.message;
                  },
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.errors.length > 0 ? true : undefined
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Token name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder="e.g. Production CI"
                      autoComplete="off"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.length > 0 ? (
                      <FieldError>
                        {field.state.meta.errors.join(", ")}
                      </FieldError>
                    ) : null}
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? "Creating…" : "Create token"}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={open && !!revealedToken}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleClose();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Token created</AlertDialogTitle>
            <AlertDialogDescription>
              Copy this token now. You won&apos;t be able to see it again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <InputGroup>
            <InputGroupInput
              value={revealedToken || ""}
              readOnly
              className="font-mono text-xs select-all"
              aria-label="Generated token"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                onClick={() => copyToClipboard(revealedToken!)}
                aria-label="Copy token"
              >
                <HugeiconsIcon icon={Copy01Icon} size={12} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          <AlertDialogFooter>
            <AlertDialogAction size="sm" onClick={handleClose}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Rename Token Dialog ──────────────────────────────────────────────────────

function RenameTokenDialogHost() {
  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const open = activeDialog?.type === "rename-token";
  const token = open ? activeDialog.token : null;

  if (!token) return null;

  const form = useForm({
    defaultValues: { name: token.name },
    onSubmit: async ({ value }) => {
      // TODO: wire to PATCH /api/services/:id/tokens/:tokenId
      await new Promise((r) => setTimeout(r, 600));
      toast.success(`Token renamed to "${value.name}"`);
      closeDialog();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename token</DialogTitle>
          <DialogDescription>
            Update the name for <strong>{token.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  const res = z
                    .string()
                    .min(1, "Name is required")
                    .max(64, "Name must be 64 characters or fewer")
                    .safeParse(value);
                  return res.success ? undefined : res.error.issues[0]?.message;
                },
              }}
            >
              {(field) => (
                <Field
                  data-invalid={
                    field.state.meta.errors.length > 0 ? true : undefined
                  }
                >
                  <FieldLabel htmlFor={field.name}>Token name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="off"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>
                      {field.state.meta.errors.join(", ")}
                    </FieldError>
                  ) : null}
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Saving…" : "Save"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Rotate Token Dialog ──────────────────────────────────────────────────────

function RotateTokenDialogHost() {
  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);
  const [isPending, setIsPending] = useState(false);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const open = activeDialog?.type === "rotate-token";
  const token = open ? activeDialog.token : null;

  if (!token) return null;

  async function handleRotate() {
    setIsPending(true);
    // TODO: wire to POST /api/services/:id/tokens/:tokenId/rotate
    await new Promise((r) => setTimeout(r, 600));
    setRevealedToken(
      `deko_sk_${"x".repeat(32)}${token?.name.slice(0, 4).toLowerCase().replace(/\s/g, "_")}`,
    );
    setIsPending(false);
  }

  function handleClose() {
    closeDialog();
    setRevealedToken(null);
  }

  return (
    <>
      <Dialog
        open={open && !revealedToken}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate token</DialogTitle>
            <DialogDescription>
              Rotating <strong>{token.name}</strong> will immediately invalidate
              the existing token. Any services using it will stop working until
              updated.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={handleRotate}
            >
              {isPending ? "Rotating…" : "Rotate token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={open && !!revealedToken}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleClose();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Token rotated</AlertDialogTitle>
            <AlertDialogDescription>
              Your previous token is now invalid. Copy the new token — you
              won&apos;t see it again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <InputGroup>
            <InputGroupInput
              value={revealedToken || ""}
              readOnly
              className="font-mono text-xs select-all"
              aria-label="New token"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                onClick={() => copyToClipboard(revealedToken!)}
                aria-label="Copy token"
              >
                <HugeiconsIcon icon={Copy01Icon} size={12} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          <AlertDialogFooter>
            <AlertDialogAction size="sm" onClick={handleClose}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Revoke Token Dialog ──────────────────────────────────────────────────────

function RevokeTokenDialogHost() {
  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);
  const [isPending, setIsPending] = useState(false);

  const open = activeDialog?.type === "revoke-token";
  const token = open ? activeDialog.token : null;

  if (!token) return null;

  async function handleRevoke() {
    setIsPending(true);
    // TODO: wire to DELETE /api/services/:id/tokens/:tokenId
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`Token "${token?.name}" revoked`);
    setIsPending(false);
    closeDialog();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeDialog();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke token</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke <strong>{token.name}</strong>? This
            action cannot be undone and any services using it will stop working
            immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => closeDialog()}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={handleRevoke}
          >
            {isPending ? "Revoking…" : "Revoke token"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Token Row Actions ────────────────────────────────────────────────────────

function TokenRowActions({ token }: { token: Token }) {
  const openDialog = useDialogStore((s) => s.openDialog);

  const tokenPayload: TokenDialogPayload = token;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Token actions" />
        }
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            openDialog({ type: "rename-token", token: tokenPayload })
          }
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openDialog({ type: "rotate-token", token: tokenPayload })
          }
        >
          <HugeiconsIcon icon={Refresh01Icon} size={12} />
          Rotate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            openDialog({ type: "revoke-token", token: tokenPayload })
          }
        >
          <HugeiconsIcon icon={Delete02Icon} size={12} />
          Revoke
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TokenDialogsHost() {
  return (
    <>
      <CreateTokenDialogHost />
      <RenameTokenDialogHost />
      <RotateTokenDialogHost />
      <RevokeTokenDialogHost />
    </>
  );
}
