import { create } from "zustand";

export type TokenDialogPayload = {
  id: string;
  name: string;
  preview: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type AppDialogState =
  | { type: "create-service" }
  | { type: "create-token" }
  | { type: "rename-token"; token: TokenDialogPayload }
  | { type: "rotate-token"; token: TokenDialogPayload }
  | { type: "revoke-token"; token: TokenDialogPayload }
  | { type: "delete-service"; serviceName: string };

type DialogStore = {
  activeDialog: AppDialogState | null;
  openDialog: (dialog: AppDialogState) => void;
  closeDialog: () => void;
};

export const useDialogStore = create<DialogStore>((set) => ({
  activeDialog: null,
  openDialog: (dialog) => set({ activeDialog: dialog }),
  closeDialog: () => set({ activeDialog: null }),
}));
