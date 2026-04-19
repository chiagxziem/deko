import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { z } from "zod";

import { DangerSettings } from "@/components/settings/danger-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { TokensSettings } from "@/components/settings/tokens-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const settingsSearchSchema = z.object({
  section: z.enum(["general", "tokens", "danger"]).catch("general"),
});

export const Route = createFileRoute("/_app/services/$serviceId/settings")({
  validateSearch: settingsSearchSchema,
  component: SettingsPage,
});

function SettingsPage() {
  const { section } = useSearch({
    from: "/_app/services/$serviceId/settings",
  });
  const { serviceId } = useParams({
    from: "/_app/services/$serviceId/settings",
  });
  const navigate = useNavigate();

  const handleTabChange = async (value: "general" | "tokens" | "danger") => {
    await navigate({
      to: "/services/$serviceId/settings",
      params: { serviceId },
      search: { section: value },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Service configuration and token management.
        </p>
      </div>

      {/* Horizontal tabs (< xl) */}
      <Tabs
        value={section}
        onValueChange={handleTabChange}
        className="gap-6 xl:hidden"
      >
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="tokens">
          <TokensSettings />
        </TabsContent>
        <TabsContent value="danger">
          <DangerSettings />
        </TabsContent>
      </Tabs>

      {/* Vertical tabs (≥ xl) */}
      <Tabs
        value={section}
        onValueChange={handleTabChange}
        orientation="vertical"
        className="hidden gap-8 xl:flex"
      >
        <TabsList className="w-36 p-0">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="pb-16">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="tokens" className="pb-16">
          <TokensSettings />
        </TabsContent>
        <TabsContent value="danger" className="pb-16">
          <DangerSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
