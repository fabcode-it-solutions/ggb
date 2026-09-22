import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import RolesUsersPage from "@/components/pages/RolesUsersPage";
import React from "react";
{
  /* <RolesUsersPage /> */
}
const page = () => {
  return (
    <ProtectedRoute>
      {/* <DashboardLayout>RolesUsersPage</DashboardLayout> */}
      <RolesUsersPage />
    </ProtectedRoute>
  );
};

export default page;
