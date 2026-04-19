import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";

import { ServiceSelectSchema } from "@repo/db/validators/service.validator";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query-keys";
import { handleError } from "@/lib/utils";
import {
  $getSingleService,
  $updateService,
  singleServiceQueryOptions,
} from "@/server/services";

export function GeneralSettings() {
  const { serviceId } = useParams({ from: "/_app/services/$serviceId" });
  const getSingleService = useServerFn($getSingleService);

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
    return <GeneralSettingsSkeleton />;
  }

  if (isError || !service) {
    return <GeneralSettingsError refetch={refetch} />;
  }

  return <GeneralSettingsForm key={service.id} service={service} />;
}

function GeneralSettingsForm({
  service,
}: {
  service: z.infer<typeof ServiceSelectSchema>;
}) {
  const updateService = useServerFn($updateService);

  const queryClient = useQueryClient();

  const updateServiceMutation = useMutation({
    mutationFn: updateService,
    onSuccess: async () => {
      toast.success("Service updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.services() });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.service(service.id),
      });
      // form.reset();
    },
    onError: (err) => {
      handleError(err, "Failed to update service");
    },
  });

  const form = useForm({
    defaultValues: {
      name: service.name,
    },
    onSubmit: async ({ value }) => {
      await updateServiceMutation.mutateAsync({
        data: {
          name: value.name,
          serviceId: service.id,
        },
      });
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
                  disabled={updateServiceMutation.isPending}
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
              value={service.slug}
              readOnly
              disabled={updateServiceMutation.isPending}
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
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

function GeneralSettingsSkeleton() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold">General</h2>
        <p className="text-xs text-muted-foreground">
          Basic service configuration
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-full" />
        </div>
        <div className="grid gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
}

function GeneralSettingsError({ refetch }: { refetch: () => void }) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold">General</h2>
        <p className="text-xs text-muted-foreground">
          Basic service configuration
        </p>
      </div>

      <Alert variant="destructive">
        <HugeiconsIcon icon={AlertCircleIcon} size={16} />
        <AlertTitle>Failed to load service settings</AlertTitle>
        <AlertDescription>
          We couldn't load this service right now. Try again.
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
