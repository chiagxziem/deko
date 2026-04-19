import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogStore } from "@/stores/dialog-store";

// Dummy data — replace with real API data when wiring
const DUMMY_SERVICE_NAME = "Production API";

export function DangerSettings() {
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold">Danger Zone</h2>
        <p className="text-xs text-muted-foreground">
          Irreversible actions for this service
        </p>
      </div>

      <Alert variant="destructive">
        <HugeiconsIcon icon={AlertCircleIcon} size={16} />
        <AlertTitle>Delete this service</AlertTitle>
        <AlertDescription>
          Permanently removes all logs, errors, endpoints, and tokens associated
          with this service. This cannot be recovered.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              openDialog({
                type: "delete-service",
                serviceName: DUMMY_SERVICE_NAME,
              })
            }
          >
            Delete service
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}

export function DeleteServiceDialogHost() {
  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const open = activeDialog?.type === "delete-service";
  const serviceName =
    activeDialog?.type === "delete-service"
      ? activeDialog.serviceName
      : DUMMY_SERVICE_NAME;

  const [isPending, setIsPending] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");

  const isConfirmed = confirmValue === serviceName;

  async function handleDelete() {
    if (!isConfirmed) return;
    setIsPending(true);
    // TODO: wire to DELETE /api/services/:id
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Service deleted");
    setIsPending(false);
    closeDialog();
    setConfirmValue("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) closeDialog();
    if (!next) setConfirmValue("");
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete service</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{serviceName}</strong> and all
            its logs, error groups, and tokens. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="confirm-delete">
              Type{" "}
              <span className="font-mono font-semibold text-foreground">
                {serviceName}
              </span>{" "}
              to confirm
            </FieldLabel>
            <Input
              id="confirm-delete"
              type="text"
              autoComplete="off"
              placeholder={serviceName}
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              aria-label="Confirm service name"
            />
          </Field>
        </FieldGroup>

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
            disabled={!isConfirmed || isPending}
            onClick={handleDelete}
          >
            {isPending ? "Deleting…" : "Delete service"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
