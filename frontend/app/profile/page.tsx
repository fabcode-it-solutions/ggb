import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ProfilePage from "@/components/pages/ProfilePage";
import React from "react";

// const page = () => {
//   return <ProfilePage />;
// };

const page = () => {
  return (
    <ProtectedRoute>
      {/* <DashboardLayout>ProfilePage</DashboardLayout> */}
      <ProfilePage />
    </ProtectedRoute>
  );
};

export default page;
