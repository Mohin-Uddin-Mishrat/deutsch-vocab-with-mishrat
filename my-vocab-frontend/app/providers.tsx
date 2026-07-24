"use client";
import { Provider } from "react-redux";
import { useState } from "react";
import { makeStore, type AppStore } from "@/redux/store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
