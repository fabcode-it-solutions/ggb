"use client";
// components/pages/ApparelInventoryPage.tsx

import { useEffect, useState } from "react";
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
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import {
  productService,
  type CreateProductRequest,
} from "@/services/product.service";
import { Product, InventoryType, ProductType } from "@/types";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/lib/validations/product.schema";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";

// Apparel only has one product type — APPAREL
const APPAREL_PRODUCT_TYPE = ProductType.APPAREL;

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM: CreateProductInput = {
  inventoryType: InventoryType.APPAREL,
  productType: ProductType.APPAREL,
  sku: "",
  ggbNumber: 0,
  dealerNumber: 0,
  inventoryCount: 0,
  wipCount: 0,
  shopifyProductId: "",
  shopifyOrderId: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApparelInventoryPage() {
  const { showToast } = useToast();
  const { pagination, setPage, setTotalPages, setTotalCount } = usePagination({
    initialLimit: 50,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<CreateProductInput>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CreateProductInput, string>>
  >({});

  const debouncedSearch = useDebounce(searchTerm, 300);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProducts();
  }, [pagination.page, debouncedSearch]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        inventoryType: InventoryType.APPAREL,
      });
      if (response.success && response.data) {
        setProducts(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.total);
        }
      }
    } catch {
      showToast("Error", "Failed to load Apparel products", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateProduct = () => {
    setFormData({ ...DEFAULT_FORM });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      inventoryType: InventoryType.APPAREL,
      productType: ProductType.APPAREL,
      sku: product.sku,
      ggbNumber: product.ggbNumber || 0,
      dealerNumber: product.dealerNumber || 0,
      inventoryCount: product.inventoryCount,
      wipCount: product.wipCount,
      shopifyProductId: product.shopifyProductId || "",
      shopifyOrderId: product.shopifyOrderId || "",
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
    if (formErrors[name as keyof CreateProductInput]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    const validation = createProductSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CreateProductInput, string>> = {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0] as keyof CreateProductInput;
        fieldErrors[field] = error.message;
      });
      setFormErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await productService.createProduct(formData as CreateProductRequest);
      showToast("Success", "Apparel product created successfully", "success");
      setIsCreateModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      showToast(
        "Error",
        error?.response?.data?.error ||
          error?.message ||
          "Failed to create product",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setFormErrors({});
    setIsSubmitting(true);

    try {
      await productService.updateProduct({
        id: selectedProduct.id,
        ...formData,
      });
      showToast("Success", "Product updated successfully", "success");
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      showToast(
        "Error",
        error?.response?.data?.error ||
          error?.message ||
          "Failed to update product",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await productService.deleteProduct(selectedProduct.id);
      showToast("Success", "Product deleted successfully", "success");
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      showToast(
        "Error",
        error?.response?.data?.error ||
          error?.message ||
          "Failed to delete product",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* ── Header ── */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Apparel Inventory</h1>
              <p className="text-muted-foreground">
                Manage your Apparel products
              </p>
            </div>
            <Button onClick={handleCreateProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {/* ── Search ── */}
          <Card className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by SKU or Shopify product ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.trim())}
                className="pl-9"
              />
            </div>
          </Card>

          {/* ── Table ── */}
          {isLoading ? (
            <Loading />
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Apparel products found"
              description="Try adjusting your search or add a new product"
            />
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>GGB Qyt</TableHead>
                      <TableHead>TCB Qyt</TableHead>
                      {/* <TableHead>Inventory</TableHead> */}
                      {/* <TableHead>WIP</TableHead> */}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell className="font-medium font-mono text-sm">
                          {product.sku}
                        </TableCell>
                        <TableCell>{product.ggbNumber || 0}</TableCell>
                        <TableCell>{product.dealerNumber || 0}</TableCell>
                        {/* <TableCell>{product.inventoryCount}</TableCell>
                        <TableCell>{product.wipCount}</TableCell> */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 className="h-4 w-4" />
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

        {/* ════════════ CREATE MODAL ════════════ */}
        <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <ModalContent className="max-w-xl">
            <ModalHeader>
              <ModalTitle>Add New Apparel Product</ModalTitle>
              <ModalDescription>
                Create a new Apparel inventory product
              </ModalDescription>
            </ModalHeader>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Product Type
                  </label>
                  <div className="px-3 py-2 border border-[#f2f2f2] bg-[#f9f9f9] text-sm text-gray-600">
                    APPAREL
                  </div>
                </div>

                <div className="col-span-2">
                  <Input
                    label="SKU"
                    name="sku"
                    value={formData.sku}
                    onChange={handleFormChange}
                    error={formErrors.sku}
                    required
                  />
                </div>

                <Input
                  label="GGB Number"
                  name="ggbNumber"
                  type="number"
                  value={formData.ggbNumber?.toString() ?? "0"}
                  onChange={handleFormChange}
                  error={formErrors.ggbNumber}
                />
                <Input
                  label="TCB Number"
                  name="dealerNumber"
                  type="number"
                  value={formData.dealerNumber?.toString() ?? "0"}
                  onChange={handleFormChange}
                  error={formErrors.dealerNumber}
                />
                {/* <Input
                  label="Inventory Count"
                  name="inventoryCount"
                  type="number"
                  value={formData.inventoryCount.toString()}
                  onChange={handleFormChange}
                  error={formErrors.inventoryCount}
                  required
                /> */}

                <div className="col-span-2">
                  <Input
                    label="Shopify Product ID"
                    name="shopifyProductId"
                    value={formData.shopifyProductId ?? ""}
                    onChange={handleFormChange}
                    placeholder="gid://shopify/Product/..."
                  />
                </div>
              </div>
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Product"}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* ════════════ EDIT MODAL ════════════ */}
        <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ModalContent className="max-w-xl">
            <ModalHeader>
              <ModalTitle>Edit Apparel Product</ModalTitle>
              <ModalDescription>Update product information</ModalDescription>
            </ModalHeader>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <div className="px-3 py-2 border border-[#f2f2f2] bg-[#f9f9f9] text-sm font-mono text-gray-900">
                    {selectedProduct?.sku}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    SKU cannot be changed
                  </p>
                </div>

                <Input
                  label="GGB Number"
                  name="ggbNumber"
                  type="number"
                  value={formData.ggbNumber?.toString() ?? "0"}
                  onChange={handleFormChange}
                />
                <Input
                  label="TCB Number"
                  name="dealerNumber"
                  type="number"
                  value={formData.dealerNumber?.toString() ?? "0"}
                  onChange={handleFormChange}
                />
                {/* <Input
                  label="Inventory Count"
                  name="inventoryCount"
                  type="number"
                  value={formData.inventoryCount.toString()}
                  onChange={handleFormChange}
                /> */}

                <div className="col-span-2">
                  <Input
                    label="Shopify Product ID"
                    name="shopifyProductId"
                    value={formData.shopifyProductId ?? ""}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
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

        {/* ════════════ DELETE MODAL ════════════ */}
        <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Delete Product</ModalTitle>
              <ModalDescription>
                Are you sure you want to delete product &quot;
                {selectedProduct?.sku}&quot;? This action cannot be undone.
              </ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
