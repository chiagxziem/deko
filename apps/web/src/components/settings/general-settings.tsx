import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Dummy data — replace with real API data when wiring
const DUMMY_SERVICE = {
  name: "Production API",
  slug: "production-api",
};

export function GeneralSettings() {
  const form = useForm({
    defaultValues: {
      name: DUMMY_SERVICE.name,
    },
    onSubmit: async ({ value }) => {
      // TODO: wire to PATCH /api/services/:id
      await new Promise((r) => setTimeout(r, 600));

      toast.success(`Service renamed to "${value.name}"`);
    },
  });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold">General</h2>
        <p className="text-xs text-muted-foreground">
          Basic service configuration
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <FieldGroup>
          {/* Service Name */}
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
                  placeholder="My API"
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

          {/* Service Slug — read-only */}
          <Field>
            <FieldLabel>Slug</FieldLabel>
            <Input
              value={DUMMY_SERVICE.slug}
              readOnly
              className="cursor-default opacity-60 select-all"
              aria-label="Service slug (read-only)"
            />
            <FieldDescription>
              The slug is used in API paths and cannot be changed.
            </FieldDescription>
          </Field>
        </FieldGroup>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit || isSubmitting}
              className="w-fit"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
