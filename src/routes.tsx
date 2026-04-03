import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { LearnerSelectionPage } from "./pages/LearnerSelectionPage";
import { LearnerCreatePage } from "./pages/LearnerCreatePage";
import { LearnerEditPage } from "./pages/LearnerEditPage";
import { ModuleListPage } from "./pages/ModuleListPage";
import { ModuleDetailPage } from "./pages/ModuleDetailPage";
import { PracticePage } from "./pages/PracticePage";
import { ParentDashboardPage } from "./pages/ParentDashboardPage";
export const router = createBrowserRouter([
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
          { path: "/learners/new", element: <LearnerCreatePage /> },
          { path: "/learners/:learnerId/edit", element: <LearnerEditPage /> },
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
          { path: "/learner-dashboard", element: <Navigate to="/modules" replace /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/modules" /> },
  { path: "*", element: <Navigate to="/modules" /> },
]);
