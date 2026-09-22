import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import WebhooksPage from "@/components/pages/WebhooksPage";
import React from "react";
{
  /* <WebhooksPage /> */
}
const page = () => {
  return (
    <ProtectedRoute>
      {/* <DashboardLayout> */}
        {/* WebhooksPage */}
           <WebhooksPage />
            {/* </DashboardLayout> */}
    </ProtectedRoute>
  );
};

export default page;
