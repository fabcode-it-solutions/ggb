import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import LogsPage from "@/components/pages/LogsPage";
import React from "react";
{
  /* <LogsPage /> */
}
const page = async () => {
  return (
    <ProtectedRoute>
      {/* <DashboardLayout>LogsPage</DashboardLayout> */}
      <LogsPage />
    </ProtectedRoute>
  );
};

export default page;
