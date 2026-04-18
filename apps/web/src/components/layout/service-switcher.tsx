import { PlusSignIcon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { CreateServiceDialog } from "@/components/create-service-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DUMMY_SERVICES,
  setLastServiceId,
  type DummyService,
} from "@/lib/service-cookie";

export function ServiceSwitcher() {
  const { isMobile } = useSidebar();
  const { serviceId = "" } = useParams({ strict: false });
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const activeService: DummyService =
    DUMMY_SERVICES.find((s) => s.id === serviceId) ?? DUMMY_SERVICES[0];

  const handleSwitch = (service: DummyService) => {
    setLastServiceId(service.id);
    void navigate({
      to: "/services/$serviceId/overview",
      params: { serviceId: service.id },
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton
            size="lg"
            render={<DropdownMenuTrigger />}
            className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="font-bold">{activeService.name.charAt(0)}</span>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeService.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {activeService.slug}
              </span>
            </div>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              size={16}
              className="ml-auto"
            />
          </SidebarMenuButton>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Services
              </DropdownMenuLabel>
              {DUMMY_SERVICES.map((service) => (
                <DropdownMenuItem
                  key={service.id}
                  onClick={() => handleSwitch(service)}
                  className="p-1.5"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <span className="text-[0.625rem] font-bold">
                      {service.name.charAt(0)}
                    </span>
                  </div>
                  {service.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="p-1.5"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                </div>
                <span className="font-medium text-muted-foreground">
                  Add service
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateServiceDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
