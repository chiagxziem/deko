import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TOKEN_GUIDE_PENDING_KEY,
  TOKEN_GUIDE_SEEN_KEY,
} from "@/lib/onboarding";
import { useDialogStore } from "@/stores/dialog-store";

export function TokenOnboardingDialog() {
  const navigate = useNavigate();
  const { serviceId } = useParams({
    from: "/_app/services/$serviceId/overview",
  });

  const openDialog = useDialogStore((s) => s.openDialog);
  const [showTokenGuide, setShowTokenGuide] = useState(false);

  useEffect(() => {
    const shouldShow = sessionStorage.getItem(TOKEN_GUIDE_PENDING_KEY) === "1";
    const alreadySeen = localStorage.getItem(TOKEN_GUIDE_SEEN_KEY) === "1";

    if (shouldShow && !alreadySeen) {
      sessionStorage.removeItem(TOKEN_GUIDE_PENDING_KEY);
      setShowTokenGuide(true);
    }
  }, []);

  const closeTokenGuide = () => {
    localStorage.setItem(TOKEN_GUIDE_SEEN_KEY, "1");
    setShowTokenGuide(false);
  };

  const goToTokenSetup = async () => {
    closeTokenGuide();
    await navigate({
      to: "/services/$serviceId/settings",
      params: { serviceId },
      search: { section: "tokens" },
    });
    openDialog({ type: "create-token", serviceId });
  };

  return (
    <AlertDialog
      open={showTokenGuide}
      onOpenChange={(open) => !open && closeTokenGuide()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create your first ingest token</AlertDialogTitle>
          <AlertDialogDescription>
            Your service is ready. Next, create a token in Settings and use it
            in your app to send logs to Deko via the
            <strong> x-deko-service-token </strong>
            header.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
          <AlertDialogAction onClick={() => void goToTokenSetup()}>
            Go to Settings
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
