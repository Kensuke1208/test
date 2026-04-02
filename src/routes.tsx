import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { LearnerSelectionPage } from "./pages/LearnerSelectionPage";
import { ModuleListPage } from "./pages/ModuleListPage";
import { ModuleDetailPage } from "./pages/ModuleDetailPage";
import { PracticePage } from "./pages/PracticePage";
import { LearnerDashboardPage } from "./pages/LearnerDashboardPage";
import { ParentDashboardPage } from "./pages/ParentDashboardPage";
import { DevPracticePage } from "./pages/DevPracticePage";

export const router = createBrowserRouter([
  // TODO: Remove or guard with import.meta.env.DEV before production
  { path: "/dev/practice", element: <DevPracticePage /> },
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/learners", element: <LearnerSelectionPage /> },
          { path: "/learners/new", element: <LearnerSelectionPage /> },
          { path: "/learners/:learnerId/edit", element: <LearnerSelectionPage /> },
          { path: "/dashboard", element: <ParentDashboardPage /> },
        ],
      },
    ],
  },
  {
    element: <AuthGuard requireLearner />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/modules", element: <ModuleListPage /> },
          { path: "/modules/:moduleId", element: <ModuleDetailPage /> },
          {
            path: "/modules/:moduleId/words/:wordId",
            element: <PracticePage />,
          },
          { path: "/learner-dashboard", element: <LearnerDashboardPage /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/login" /> },
  { path: "*", element: <Navigate to="/login" /> },
]);
