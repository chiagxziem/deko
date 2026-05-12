import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDialogStore } from "@/stores/dialog-store";

const formatQueryKey = (key: ReadonlyArray<unknown>) => {
  return key
    .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
    .join(" > ");
};

export function QueryErrorsDialog() {
  const queryClient = useQueryClient();

  const activeDialog = useDialogStore((s) => s.activeDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const isOpen = activeDialog?.type === "query-errors";
  const errors =
    activeDialog?.type === "query-errors" ? activeDialog.errors : [];

  const handleRefetch = async () => {
    await queryClient.refetchQueries();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="text-destructive"
              size={20}
            />
            <DialogTitle>Data Fetching Errors</DialogTitle>
          </div>
          <DialogDescription>
            The following queries failed to load. You can try refetching them or
            contact support if the issue persists.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[40vh] overflow-y-auto py-2">
          <ul className="space-y-2">
            {errors.map((err, i) => (
              <li
                // oxlint-disable-next-line react/no-array-index-key
                key={i}
                className="flex flex-col gap-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[11px]"
              >
                <div className="font-mono font-bold tracking-tight text-destructive/80 uppercase">
                  {formatQueryKey(err.queryKey)}
                </div>
                <div className="text-foreground/90">{err.message}</div>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={closeDialog}>
            Dismiss
          </Button>
          <Button size="sm" onClick={handleRefetch}>
            Refetch all queries
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
