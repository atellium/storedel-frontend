import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ToastType = "success" | "error" | "info";

export type UiState = {
  siteLoader: {
    visible: boolean;
    label: string;
  };
  toast: {
    id: number;
    visible: boolean;
    type: ToastType;
    title: string;
    message?: string;
  } | null;
};

const initialState: UiState = {
  siteLoader: {
    visible: false,
    label: "Loading...",
  },
  toast: null,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showSiteLoader(state, action: PayloadAction<string | undefined>) {
      state.siteLoader.visible = true;
      state.siteLoader.label = action.payload ?? "Loading...";
    },
    hideSiteLoader(state) {
      state.siteLoader.visible = false;
    },
    hideToast(state) {
      if (state.toast) {
        state.toast.visible = false;
      }
    },
    showToast(
      state,
      action: PayloadAction<{
        message?: string;
        title: string;
        type?: ToastType;
      }>,
    ) {
      state.toast = {
        id: Date.now(),
        visible: true,
        type: action.payload.type ?? "info",
        title: action.payload.title,
        message: action.payload.message,
      };
    },
  },
});

export const { hideSiteLoader, hideToast, showSiteLoader, showToast } =
  uiSlice.actions;

export default uiSlice.reducer;
