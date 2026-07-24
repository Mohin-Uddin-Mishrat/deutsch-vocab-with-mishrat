import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthCredentials, UserRole } from "./types";

type AuthState = { accessToken: string | null; role: UserRole | null };
const initialState: AuthState = { accessToken: null, role: null };
const authSlice = createSlice({ name: "auth", initialState, reducers: {
  setCredentials: (state, action: PayloadAction<AuthCredentials>) => { state.accessToken = action.payload.accessToken; state.role = action.payload.role ?? null; },
  clearCredentials: (state) => { state.accessToken = null; state.role = null; },
} });
export const { clearCredentials, setCredentials } = authSlice.actions;
export default authSlice.reducer;
