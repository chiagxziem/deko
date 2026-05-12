import { QueryErrorsDialog } from "@/components/layout/query-errors-dialog";
import { CreateServiceDialog } from "@/components/services/create-service-dialog";
import { DeleteServiceDialogHost } from "@/components/settings/danger-settings";
import { TokenDialogsHost } from "@/components/settings/tokens-settings";

export function DialogHost() {
  return (
    <>
      <CreateServiceDialog />
      <TokenDialogsHost />
      <DeleteServiceDialogHost />
      <QueryErrorsDialog />
    </>
  );
}
