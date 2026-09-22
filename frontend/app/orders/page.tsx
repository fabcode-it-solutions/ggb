import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import OrdersPage from "@/components/pages/OrdersPage";

const page = () => {
  return (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  );
};

export default page;
