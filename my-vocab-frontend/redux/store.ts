import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/redux/features/auth/authSlice";
import { authApi } from "@/redux/services/authApi";

export const makeStore = () => configureStore({ reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer }, middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware) });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
