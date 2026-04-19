import {
  AlertCircleIcon,
  Copy01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  Refresh01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ServiceTokenPublicSchema } from "@repo/db/validators/service.validator";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query-keys";
import { handleError } from "@/lib/utils";
import {
  $createServiceToken,
  $deleteServiceToken,
  $getSingleService,
  $rotateServiceToken,
  $updateServiceToken,
  singleServiceQueryOptions,
} from "@/server/services";
import { type TokenDialogPayload, useDialogStore } from "@/stores/dialog-store";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "-";

  return format(date, "MMM d, yyyy");
}

type Token = z.infer<typeof ServiceTokenPublicSchema>;

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
        {row.original.tokenPreview}
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
  const { serviceId } = useParams({ from: "/_app/services/$serviceId" });
  const getSingleService = useServerFn($getSingleService);
  const openDialog = useDialogStore((s) => s.openDialog);

  const {
    data: service,
    isPending,
    isError,
    refetch,
  } = useQuery({
    ...singleServiceQueryOptions(serviceId),
    queryFn: () => getSingleService({ data: serviceId }),
  });

  if (isPending) {
    return <TokensSettingsSkeleton />;
  }

  if (isError || !service) {
    return <TokensSettingsError refetch={refetch} />;
  }

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
          onClick={() => openDialog({ type: "create-token", serviceId })}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={12} />
          Create token
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={service.tokens}
        emptyMessage="No tokens yet."
      />
    </div>
  );
}

function TokensSettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Tokens</h2>
          <p className="text-xs text-muted-foreground">
            Manage API tokens for this service.
          </p>
        </div>
        <Skeleton className="h-6 w-28" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function TokensSettingsError({ refetch }: { refetch: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Tokens</h2>
          <p className="text-xs text-muted-foreground">
            Manage API tokens for this service.
          </p>
        </div>
      </div>

      <Alert variant="destructive" className="max-w-2xl">
        <HugeiconsIcon icon={AlertCircleIcon} size={16} />
        <AlertTitle>Failed to load service tokens</AlertTitle>
        <AlertDescription>
          We couldn&apos;t load tokens right now. Try again.
        </AlertDescription>
      </Alert>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-fit"
        onClick={refetch}
      >
        Retry
      </Button>
    </div>
  );
}

// ── Create Token Dialog ──────────────────────────────────────────────────────

function CreateTokenDialogHost() {
  const createServiceToken = useServerFn($createServiceToken);
  const queryClient = useQueryClient();

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const open = activeDialog?.type === "create-token";
  const serviceId = open ? activeDialog.serviceId : null;

  const createTokenMutation = useMutation({
    mutationFn: createServiceToken,
    onSuccess: async (newToken) => {
      setRevealedToken(newToken.token);

      if (serviceId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.service(serviceId),
        });
      }
    },
    onError: (err) => {
      handleError(err, "Failed to create token");
    },
  });

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      if (!serviceId) return;

      await createTokenMutation.mutateAsync({
        data: {
          name: value.name,
          serviceId,
        },
      });
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
                    disabled={
                      !canSubmit ||
                      isSubmitting ||
                      createTokenMutation.isPending
                    }
                  >
                    {isSubmitting || createTokenMutation.isPending
                      ? "Creating…"
                      : "Create token"}
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
              <CopyTokenButton token={revealedToken || ""} />
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
  const updateServiceToken = useServerFn($updateServiceToken);
  const queryClient = useQueryClient();

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const open = activeDialog?.type === "rename-token";
  const token = open ? activeDialog.token : null;

  const updateTokenMutation = useMutation({
    mutationFn: updateServiceToken,
    onSuccess: async (_updated, vars) => {
      toast.success("Token renamed");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.service(vars.data.serviceId),
      });
      closeDialog();
    },
    onError: (err) => {
      handleError(err, "Failed to rename token");
    },
  });

  if (!token) return null;

  return (
    <RenameTokenDialogContent
      key={token.id}
      token={token}
      open={open}
      closeDialog={closeDialog}
      isSaving={updateTokenMutation.isPending}
      onSubmit={async (name) => {
        await updateTokenMutation.mutateAsync({
          data: {
            name,
            serviceId: token.serviceId,
            tokenId: token.id,
          },
        });
      }}
    />
  );
}

function RenameTokenDialogContent({
  token,
  open,
  closeDialog,
  isSaving,
  onSubmit,
}: {
  token: Token;
  open: boolean;
  closeDialog: () => void;
  isSaving: boolean;
  onSubmit: (name: string) => Promise<void>;
}) {
  const form = useForm({
    defaultValues: { name: token.name },
    onSubmit: async ({ value }) => {
      await onSubmit(value.name);
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
                  disabled={!canSubmit || isSubmitting || isSaving}
                >
                  {isSubmitting || isSaving ? "Saving…" : "Save"}
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
  const rotateServiceToken = useServerFn($rotateServiceToken);
  const queryClient = useQueryClient();

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const open = activeDialog?.type === "rotate-token";
  const token = open ? activeDialog.token : null;

  const rotateTokenMutation = useMutation({
    mutationFn: rotateServiceToken,
    onSuccess: async (rotated, vars) => {
      setRevealedToken(rotated.token);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.service(vars.data.serviceId),
      });
    },
    onError: (err) => {
      handleError(err, "Failed to rotate token");
    },
  });

  if (!token) return null;

  async function handleRotate() {
    if (!token) return;

    await rotateTokenMutation.mutateAsync({
      data: {
        serviceId: token.serviceId,
        tokenId: token.id,
      },
    });
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
              disabled={rotateTokenMutation.isPending}
              onClick={handleRotate}
            >
              {rotateTokenMutation.isPending ? "Rotating…" : "Rotate token"}
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
              <CopyTokenButton token={revealedToken || ""} />
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
  const deleteServiceToken = useServerFn($deleteServiceToken);
  const queryClient = useQueryClient();

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const open = activeDialog?.type === "revoke-token";
  const token = open ? activeDialog.token : null;

  const deleteTokenMutation = useMutation({
    mutationFn: deleteServiceToken,
    onSuccess: async (_res, vars) => {
      toast.success("Token revoked");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.service(vars.data.serviceId),
      });
      closeDialog();
    },
    onError: (err) => {
      handleError(err, "Failed to revoke token");
    },
  });

  if (!token) return null;

  async function handleRevoke() {
    if (!token) return;

    await deleteTokenMutation.mutateAsync({
      data: {
        serviceId: token.serviceId,
        tokenId: token.id,
      },
    });
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
            disabled={deleteTokenMutation.isPending}
            onClick={() => closeDialog()}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={deleteTokenMutation.isPending}
            onClick={handleRevoke}
          >
            {deleteTokenMutation.isPending ? "Revoking…" : "Revoke token"}
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

function CopyTokenButton({ token }: { token: string }) {
  const timeoutRef = useRef<number | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipText =
    copyState === "copied"
      ? "Copied"
      : copyState === "error"
        ? "Copy failed"
        : "Copy token";

  const isCopied = copyState === "copied";

  async function handleCopy() {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopyState("idle");
      timeoutRef.current = null;
    }, 1500);
  }

  return (
    <InputGroupButton
      size="icon-sm"
      aria-label={tooltipText}
      onClick={() => {
        void handleCopy();
      }}
      disabled={!token || copyState === "error" || copyState === "copied"}
    >
      <HugeiconsIcon icon={isCopied ? Tick02Icon : Copy01Icon} size={12} />
    </InputGroupButton>
  );
}
