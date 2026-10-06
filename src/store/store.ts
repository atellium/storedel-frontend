import {
  combineReducers,
  configureStore,
  type Action,
  type ThunkAction,
} from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  type PersistConfig,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "@/features/auth/auth-slice";
import {
  authPersistTransform,
  preferencesPersistTransform,
} from "./persist-transforms";
import preferencesReducer from "./slices/preferences-slice";
import uiReducer from "./slices/ui-slice";

const rootReducer = combineReducers({
  auth: authReducer,
  preferences: preferencesReducer,
  ui: uiReducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootReducerState> = {
  key: "storedel",
  storage,
  whitelist: ["auth", "preferences"],
  transforms: [authPersistTransform, preferencesPersistTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = RootReducerState;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;
