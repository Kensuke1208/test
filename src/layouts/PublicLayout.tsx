import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Eigo</h1>
        <Outlet />
      </div>
    </div>
  );
}
