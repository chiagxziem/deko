import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query-keys";
import { handleError } from "@/lib/utils";
import {
  $deleteService,
  $getSingleService,
  singleServiceQueryOptions,
} from "@/server/services";
import { useDialogStore } from "@/stores/dialog-store";

export function DangerSettings() {
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
    return <DangerSettingsSkeleton />;
  }

  if (isError || !service) {
    return <DangerSettingsError refetch={refetch} />;
  }

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
                serviceId: service.id,
                serviceName: service.name,
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
  const navigate = useNavigate();
  const deleteService = useServerFn($deleteService);
  const queryClient = useQueryClient();

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const [confirmValue, setConfirmValue] = useState("");

  const open = activeDialog?.type === "delete-service";
  const serviceName = open ? activeDialog.serviceName : "";
  const serviceId = open ? activeDialog.serviceId : null;

  const deleteServiceMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: async () => {
      toast.success("Service deleted");
      await queryClient.invalidateQueries({ queryKey: queryKeys.services() });
      if (serviceId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.service(serviceId),
        });
      }
      closeDialog();
      setConfirmValue("");
      await navigate({ to: "/get-started" });
    },
    onError: (err) => {
      handleError(err, "Failed to delete service");
    },
  });

  const isConfirmed = confirmValue === serviceName;

  async function handleDelete() {
    if (!isConfirmed || !serviceId) return;
    await deleteServiceMutation.mutateAsync({ data: serviceId });
  }

  function handleCloseDialog() {
    closeDialog();
    setConfirmValue("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) handleCloseDialog();
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
            disabled={deleteServiceMutation.isPending}
            onClick={() => handleCloseDialog()}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!isConfirmed || deleteServiceMutation.isPending}
            onClick={handleDelete}
          >
            {deleteServiceMutation.isPending ? "Deleting…" : "Delete service"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DangerSettingsSkeleton() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold">Danger Zone</h2>
        <p className="text-xs text-muted-foreground">
          Irreversible actions for this service
        </p>
      </div>

      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function DangerSettingsError({ refetch }: { refetch: () => void }) {
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
        <AlertTitle>Failed to load service</AlertTitle>
        <AlertDescription>
          We couldn&apos;t load this service right now. Try again.
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
