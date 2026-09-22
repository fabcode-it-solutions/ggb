"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import {
  productService,
  type ProductionPlanningFilters,
  type UpdateProductRequest,
} from "@/services/product.service";
import { InventoryType, type ProductionPlanningItem } from "@/types";
import { Edit, Package, Search } from "lucide-react";

type InventoryTab = InventoryType | "all";

type EditableFields = {
  wipCount: string;
  buildCount: string;
};

const INVENTORY_TABS: Array<{ label: string; value: InventoryTab }> = [
  { label: "All", value: "all" },
  { label: "SNOW", value: InventoryType.SNOW },
  { label: "SXS", value: InventoryType.SXS },
];

const EMPTY_EDITABLE_FIELDS: EditableFields = {
  wipCount: "",
  buildCount: "",
};

const toInputFields = (product: ProductionPlanningItem): EditableFields => ({
  wipCount: String(product.wipCount ?? 0),
  buildCount: String(product.buildCount ?? 0),
});

const parseRequiredInt = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "string"
  ) {
    return error.response.data.error;
  }

  return fallback;
};

export default function ProductionPlanningPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { pagination, setPage, setTotalPages, setTotalCount } = usePagination({
    initialLimit: 50,
  });

  const [rows, setRows] = useState<ProductionPlanningItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInventoryType, setSelectedInventoryType] =
    useState<InventoryTab>("all");
  const [editingProduct, setEditingProduct] =
    useState<ProductionPlanningItem | null>(null);
  const [editFields, setEditFields] = useState<EditableFields>(
    EMPTY_EDITABLE_FIELDS,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return Boolean(
      user.userRoles?.some((userRole) => userRole?.role?.type === "ADMIN"),
    );
  }, [user]);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: ProductionPlanningFilters = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm || undefined,
        inventoryType:
          selectedInventoryType === "all" ? "all" : selectedInventoryType,
      };

      const response = await productService.getProductionPlanning(filters);

      if (response.success && response.data) {
        setRows(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.total);
        }
      }
    } catch {
      showToast("Error", "Failed to load production planning data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearchTerm,
    pagination.limit,
    pagination.page,
    selectedInventoryType,
    setTotalCount,
    setTotalPages,
    showToast,
  ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleTabChange = (tab: InventoryTab) => {
    setSelectedInventoryType(tab);
    setPage(1);
  };

  const handleEditFieldChange = (
    field: keyof EditableFields,
    value: string,
  ) => {
    setEditFields((current) => ({ ...current, [field]: value }));
  };

  const openEditModal = (product: ProductionPlanningItem) => {
    setEditingProduct(product);
    setEditFields(toInputFields(product));
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditFields(EMPTY_EDITABLE_FIELDS);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateProductRequest = {
        id: editingProduct.id,
        wipCount: parseRequiredInt(editFields.wipCount),
        buildCount: parseRequiredInt(editFields.buildCount),
      };

      await productService.updateProduct(payload);
      showToast("Success", "Product updated successfully", "success");
      closeEditModal();
      fetchRows();
    } catch (error: unknown) {
      showToast(
        "Error",
        getErrorMessage(error, "Failed to update product"),
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Warehouse</h1>
              <p className="text-muted-foreground">
                Review SNOW and SXS demand, then update planning counts.
              </p>
            </div>

            <Button asChild>
              <Link href="/inventory/production/edit">Bulk Edit Warehouse</Link>
            </Button>
          </div>

          <Card className="p-4 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute  z-[1] left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or shopify product id"
                  value={searchTerm}
                  onChange={(event) =>
                    handleSearchChange(event.target.value.trim())
                  }
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {INVENTORY_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={
                    selectedInventoryType === tab.value ? "default" : "outline"
                  }
                  onClick={() => handleTabChange(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </Card>

          {isLoading ? (
            <Loading />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.no</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>REQ&apos;D</TableHead>
                      <TableHead>GGB</TableHead>
                      <TableHead>TCB</TableHead>
                      <TableHead>WIP</TableHead>
                      <TableHead>BUILD</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>{row.inventoryType}</TableCell>
                        <TableCell className="font-medium">{row.sku}</TableCell>
                        <TableCell>{row.requiredQty}</TableCell>
                        <TableCell>{row.ggbNumber ?? 0}</TableCell>
                        <TableCell>{row.dealerNumber ?? 0}</TableCell>
                        <TableCell>{row.wipCount ?? 0}</TableCell>
                        <TableCell>{row.buildCount ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(row)}
                              aria-label={`Edit ${row.sku}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <div className="flex justify-center">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>

        <Modal
          open={!!editingProduct}
          onOpenChange={(open) => !open && closeEditModal()}
        >
          <ModalContent className="max-w-xl">
            <ModalHeader>
              <ModalTitle>Edit Product</ModalTitle>
              <ModalDescription>
                Update planning values for {editingProduct?.sku}.
              </ModalDescription>
            </ModalHeader>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="SKU" value={editingProduct?.sku ?? ""} disabled />
                <Input
                  label="REQ'D"
                  value={String(editingProduct?.requiredQty ?? 0)}
                  disabled
                />
                <Input
                  label="GGB"
                  value={String(editingProduct?.ggbNumber ?? 0)}
                  disabled
                />
                <Input
                  label="TCB"
                  value={String(editingProduct?.dealerNumber ?? 0)}
                  disabled
                />
                <Input
                  label="WIP"
                  type="number"
                  min="0"
                  value={editFields.wipCount}
                  onChange={(event) =>
                    handleEditFieldChange("wipCount", event.target.value)
                  }
                />
                <Input
                  label="BUILD"
                  type="number"
                  min="0"
                  value={editFields.buildCount}
                  onChange={(event) =>
                    handleEditFieldChange("buildCount", event.target.value)
                  }
                />
              </div>
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
