import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemePreference = "light" | "dark" | "system";

export type PreferencesState = {
  theme: ThemePreference;
  language: string;
  location: {
    accuracy: number | null;
    fetchedAt: string | null;
    latitude: number;
    longitude: number;
  } | null;
  sessionCounter: number;
};

const initialState: PreferencesState = {
  theme: "system",
  language: "en",
  location: null,
  sessionCounter: 0,
};

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
    },
    setLocation(
      state,
      action: PayloadAction<NonNullable<PreferencesState["location"]>>,
    ) {
      state.location = action.payload;
    },
    incrementSessionCounter(state) {
      state.sessionCounter += 1;
    },
  },
});

export const { incrementSessionCounter, setLanguage, setLocation, setTheme } =
  preferencesSlice.actions;

export default preferencesSlice.reducer;
