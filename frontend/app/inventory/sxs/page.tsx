import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import SxsInventoryPage from "@/components/pages/SxsInventoryPage";
import React from "react";
{
  /* <SxsInventoryPage /> */
}
const page = () => {
  return (
    <ProtectedRoute>
      {/* <DashboardLayout>SxsInventoryPage</DashboardLayout> */}
      <SxsInventoryPage />
    </ProtectedRoute>
  );
};

export default page;
