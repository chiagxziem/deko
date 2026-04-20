import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { handleError } from "@/lib/utils";
import { $createService, $setLastService } from "@/server/services";
import { useDialogStore } from "@/stores/dialog-store";

export function CreateServiceDialog() {
  const navigate = useNavigate();
  const createService = useServerFn($createService);
  const setLastService = useServerFn($setLastService);
  const queryClient = useQueryClient();

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const dialogOpen = activeDialog?.type === "create-service";

  const createServiceMutation = useMutation({
    mutationFn: createService,
    onSuccess: async (newService) => {
      await setLastService({ data: newService.id });
      await queryClient.invalidateQueries({ queryKey: queryKeys.services() });
      queryClient.setQueryData(queryKeys.service(newService.id), newService);

      closeDialog();
      form.reset();
      toast.success(`Service "${newService.name}" created`);

      void navigate({
        to: "/services/$serviceId/overview",
        params: { serviceId: newService.id },
      });
    },
    onError: (err) => {
      handleError(err, "Failed to create service");
    },
  });

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await createServiceMutation.mutateAsync({
        data: value.name,
      });
    },
  });

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeDialog();
        if (!nextOpen) form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create service</DialogTitle>
          <DialogDescription>
            Add a new service to start collecting API telemetry.
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
                <FieldLabel htmlFor={field.name}>Service name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  disabled={createServiceMutation.isPending}
                  placeholder="e.g. Payments API"
                  autoComplete="off"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.length > 0 ? (
                  <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                ) : null}
              </Field>
            )}
          </form.Field>

          <DialogFooter showCloseButton>
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={
                    !canSubmit ||
                    isSubmitting ||
                    createServiceMutation.isPending
                  }
                >
                  {isSubmitting || createServiceMutation.isPending
                    ? "Creating…"
                    : "Create service"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
