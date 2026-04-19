import { useForm } from "@tanstack/react-form";
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
import { $setLastService } from "@/server/services";
import { useDialogStore } from "@/stores/dialog-store";

export function CreateServiceDialog() {
  const navigate = useNavigate();
  const setLastService = useServerFn($setLastService);

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const dialogOpen = activeDialog?.type === "create-service";

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      // TODO: wire to POST /api/services
      await new Promise((r) => setTimeout(r, 400));

      // Simulate new service creation — replace with real response ID
      const newId = crypto.randomUUID();
      await setLastService({ data: newId });
      closeDialog();
      toast.success(`Service "${value.name}" created`);

      void navigate({
        to: "/services/$serviceId/overview",
        params: { serviceId: newId },
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
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create service"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
