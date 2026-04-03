import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes";
import { useLearnerStore } from "./stores/learner-store";
import "./index.css";

const queryClient = new QueryClient();

async function init() {
  if (import.meta.env.DEV) {
    const { bootstrapDevAuth } = await import("./lib/dev-auth");
    const learnerId = await bootstrapDevAuth();
    if (learnerId && !useLearnerStore.getState().selectedLearnerId) {
      useLearnerStore.getState().setSelectedLearnerId(learnerId);
    }
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

init();
