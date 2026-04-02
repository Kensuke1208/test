import { Outlet } from "react-router-dom";
import { TopBar } from "../components/TopBar";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
