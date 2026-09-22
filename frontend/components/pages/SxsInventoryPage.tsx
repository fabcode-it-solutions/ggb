"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
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
  type ProductFilters,
  type CreateProductRequest,
} from "@/services/product.service";
import { Product, InventoryType, ProductType } from "@/types";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/lib/validations/product.schema";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SXS_PRODUCT_TYPES = [
  ProductType.SXS_SPORT,
  ProductType.SXS_TRAIL,
  ProductType.SXS_QUIET,
  // ProductType.SXS_DUAL,
  ProductType.SXS_SPORT_PRO,
  ProductType.SXS_TIPS,
  ProductType.SXS_OTHER,
];

export default function SxsInventoryPage() {
  const { showToast } = useToast();
  const { pagination, setPage, setTotalPages, setTotalCount } = usePagination({
    initialLimit: 50,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<
    ProductType | "all" | ""
  >("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateProductInput>({
    inventoryType: InventoryType.SXS,
    productType: ProductType.SXS_QUIET,
    sku: "",
    ggbNumber: 0,
    dealerNumber: 0,
    inventoryCount: 0,
    wipCount: 0,
    shopifyProductId: "",
    shopifyOrderId: "",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CreateProductInput, string>>
  >({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, debouncedSearchTerm, selectedProductType]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const filters: ProductFilters = {
        page: pagination.page,
        limit: pagination.limit,
        inventoryType: InventoryType.SXS,
        search: debouncedSearchTerm || undefined,
        productType: selectedProductType || undefined,
      };

      const response = await productService.getProducts(filters);

      if (response.success && response.data) {
        setProducts(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.total);
        }
      }
    } catch (error: any) {
      showToast("Error", "Failed to load products", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setFormData({
      inventoryType: InventoryType.SXS,
      productType: ProductType.SXS_QUIET,
      sku: "",
      ggbNumber: 0,
      dealerNumber: 0,
      inventoryCount: 0,
      wipCount: 0,
      shopifyProductId: "",
      shopifyOrderId: "",
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      inventoryType: product.inventoryType,
      productType: product.productType,
      sku: product.sku,
      ggbNumber: product.ggbNumber || 0,
      dealerNumber: product.dealerNumber || 0,
      inventoryCount: product.inventoryCount || 0,
      wipCount: product.wipCount || 0,
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

  const handleProductTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, productType: value as ProductType }));
  };

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
      showToast("Success", "Product created successfully", "success");
      setIsCreateModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      if (error.response.data.error) {
        showToast(
          "Error",
          error.response.data.error || "Failed to create product",
          "error",
        );
      } else {
        if (error.response.data.error) {
          showToast(
            "Error",
            error.response.data.error || "Failed to create product",
            "error",
          );
        } else {
          showToast(
            "Error",
            error.message || "Failed to create product",
            "error",
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (error.response.data.error) {
        showToast(
          "Error",
          error.response.data.error || "Failed to create product",
          "error",
        );
      } else {
        showToast(
          "Error",
          error.message || "Failed to update product",
          "error",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      await productService.deleteProduct(selectedProduct.id);
      showToast("Success", "Product deleted successfully", "success");
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      if (error.response.data.error) {
        showToast(
          "Error",
          error.response.data.error || "Failed to create product",
          "error",
        );
      } else {
        showToast(
          "Error",
          error.message || "Failed to delete product",
          "error",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const { user } = useAuth();
  const hasRole = useMemo(() => {
    if (!user) return false;
    const role = user.userRoles?.some((ur) => ur?.role?.type === "ADMIN");
    return role;
  }, [user]);
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">SXS Inventory</h1>
              <p className="text-muted-foreground">Manage your SXS products</p>
            </div>
            <Button onClick={handleCreateProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          <Card className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute   z-[1] left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or shopify product id"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.trim())}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedProductType}
                onValueChange={(value) =>
                  setSelectedProductType((value as ProductType) || "")
                }
              >
                <SelectTrigger className="w-full md:w-50">
                  <SelectValue placeholder="All Product Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Product Types</SelectItem>
                  {SXS_PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                onClick={() => setSelectedProductType("all")}
                variant={selectedProductType == "all" ? "default" : "outline"}
              >
                All
              </Button>
              {SXS_PRODUCT_TYPES.map((type) => (
                <Button
                  onClick={() =>
                    setSelectedProductType((type as ProductType) || "")
                  }
                  variant={selectedProductType == type ? "default" : "outline"}
                  key={type}
                >
                  {type.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
          </Card>

          {isLoading ? (
            <Loading />
          ) : products.length === 0 ? (
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
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Type</TableHead>
                      <TableHead>GGB QTY</TableHead>
                      <TableHead>TCB QTY</TableHead>
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
                        <TableCell className="font-medium">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          {product.productType
                            .replace("SXS_", "SXS ")
                            .replace("_", " ")}
                        </TableCell>
                        <TableCell>{product.ggbNumber || 0}</TableCell>
                        <TableCell>{product.dealerNumber || 0}</TableCell>
                        {/* <TableCell>{product.inventoryCount}</TableCell> */}
                        {/* <TableCell>{product.wipCount}</TableCell> */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {hasRole && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProduct(product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Create and Edit Modals - Similar to SNOW page */}
        <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <ModalContent className="max-w-xl">
            <ModalHeader>
              <ModalTitle>Add New Product</ModalTitle>
              <ModalDescription>
                Create a new SXS inventory product
              </ModalDescription>
            </ModalHeader>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Product Type *
                  </label>
                  <Select
                    value={formData.productType}
                    onValueChange={handleProductTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SXS_PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("SXS_", "").replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={handleFormChange}
                  error={formErrors.sku}
                  required
                />
                <Input
                  label="GGB QTY"
                  name="ggbNumber"
                  type="number"
                  value={formData.ggbNumber}
                  onChange={handleFormChange}
                />
                <Input
                  label="TCB QTY"
                  name="dealerNumber"
                  type="number"
                  value={formData.dealerNumber}
                  onChange={handleFormChange}
                />

                <Input
                  label="Shopify Product ID"
                  name="shopifyProductId"
                  value={formData.shopifyProductId}
                  onChange={handleFormChange}
                />
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

        <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ModalContent className="max-w-xl">
            <ModalHeader>
              <ModalTitle>Edit Product</ModalTitle>
              <ModalDescription>Update product information</ModalDescription>
            </ModalHeader>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Product Type *
                  </label>
                  <Select
                    value={formData.productType}
                    onValueChange={handleProductTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SXS_PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("SXS_", "").replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={handleFormChange}
                  required
                />
                <Input
                  label="GGB QTY"
                  name="ggbNumber"
                  type="number"
                  value={formData.ggbNumber}
                  onChange={handleFormChange}
                />
                <Input
                  label="TCB QTY"
                  name="dealerNumber"
                  type="number"
                  value={formData.dealerNumber}
                  onChange={handleFormChange}
                />

                <Input
                  label="Shopify Product ID"
                  name="shopifyProductId"
                  value={formData.shopifyProductId}
                  onChange={handleFormChange}
                />
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

        <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Delete Product</ModalTitle>
              <ModalDescription>
                Are you sure you want to delete product "{selectedProduct?.sku}
                "? This action cannot be undone.
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
                type="button"
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
