import React, { useState, useEffect } from "react";
import { HomePage } from "@/pages/HomePage";
import { AdminPage } from "@/pages/AdminPage";
import { ReservaConfirmadaPage } from "@/pages/ReservaConfirmadaPage";

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (currentPath === "/admin" || currentPath.startsWith("/admin")) {
    return <AdminPage />;
  }

  if (currentPath === "/reserva-confirmada" || currentPath.startsWith("/reserva-confirmada")) {
    return <ReservaConfirmadaPage />;
  }

  return <HomePage />;
}

export default App;
