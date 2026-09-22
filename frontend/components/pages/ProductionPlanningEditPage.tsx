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
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import {
  productService,
  type ProductionPlanningFilters,
} from "@/services/product.service";
import { InventoryType, type ProductionPlanningItem } from "@/types";
import { ArrowLeft, Package, Save, Search } from "lucide-react";

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

const toEditableFields = (product: ProductionPlanningItem): EditableFields => ({
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

export default function ProductionPlanningEditPage() {
  const { showToast } = useToast();
  const { pagination, setPage, setTotalPages, setTotalCount } = usePagination({
    initialLimit: 100,
  });

  const [rows, setRows] = useState<ProductionPlanningItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInventoryType, setSelectedInventoryType] =
    useState<InventoryTab>("all");
  const [drafts, setDrafts] = useState<Record<string, EditableFields>>({});
  const [dirtyIds, setDirtyIds] = useState<string[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const dirtyCount = useMemo(() => dirtyIds.length, [dirtyIds]);
  const canLoadMore = pagination.page < pagination.totalPages;

  const getFilters = useCallback(
    (page: number): ProductionPlanningFilters => ({
      page,
      limit: pagination.limit,
      search: debouncedSearchTerm || undefined,
      inventoryType:
        selectedInventoryType === "all" ? "all" : selectedInventoryType,
    }),
    [debouncedSearchTerm, pagination.limit, selectedInventoryType],
  );

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      const response = await productService.getProductionPlanning(
        getFilters(page),
      );

      if (response.success && response.data) {
        const incomingRows = response.data.data;

        setRows((current) => {
          if (!append) return incomingRows;

          const existingIds = new Set(current.map((row) => row.id));
          const nextRows = incomingRows.filter(
            (row) => !existingIds.has(row.id),
          );
          return [...current, ...nextRows];
        });

        setDrafts((current) => {
          if (!append) {
            return Object.fromEntries(
              incomingRows.map((row) => [
                row.id,
                current[row.id] ?? toEditableFields(row),
              ]),
            );
          }

          const nextDrafts = { ...current };
          for (const row of incomingRows) {
            if (!nextDrafts[row.id]) {
              nextDrafts[row.id] = toEditableFields(row);
            }
          }
          return nextDrafts;
        });

        if (!append) {
          const incomingIds = new Set(incomingRows.map((row) => row.id));
          setDirtyIds((current) => current.filter((id) => incomingIds.has(id)));
        }

        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.total);
        }
      }
    },
    [getFilters, setTotalCount, setTotalPages],
  );

  useEffect(() => {
    setIsLoading(true);
    setRows([]);
    setDrafts({});
    setDirtyIds([]);
    setPage(1);

    loadPage(1, false)
      .catch(() => {
        showToast("Error", "Failed to load production planning data", "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    debouncedSearchTerm,
    selectedInventoryType,
    loadPage,
    setPage,
    showToast,
  ]);

  const refreshLoadedPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedRows: ProductionPlanningItem[] = [];

      for (let page = 1; page <= pagination.page; page += 1) {
        const response = await productService.getProductionPlanning(
          getFilters(page),
        );

        if (response.success && response.data) {
          loadedRows.push(...response.data.data);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages);
            setTotalCount(response.data.pagination.total);
          }
        }
      }

      setRows(loadedRows);
      setDrafts(
        Object.fromEntries(
          loadedRows.map((row) => [row.id, toEditableFields(row)]),
        ),
      );
      setDirtyIds([]);
    } catch {
      showToast("Error", "Failed to refresh warehouse data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [getFilters, pagination.page, setTotalCount, setTotalPages, showToast]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleTabChange = (tab: InventoryTab) => {
    setSelectedInventoryType(tab);
  };

  const handleLoadMore = async () => {
    if (!canLoadMore || isLoadingMore) return;

    const nextPage = pagination.page + 1;
    setIsLoadingMore(true);
    try {
      await loadPage(nextPage, true);
      setPage(nextPage);
    } catch {
      showToast("Error", "Failed to load more SKUs", "error");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleDraftChange = (
    product: ProductionPlanningItem,
    field: keyof EditableFields,
    value: string,
  ) => {
    setDrafts((current) => {
      const nextDrafts = {
        ...current,
        [product.id]: {
          ...(current[product.id] ?? toEditableFields(product)),
          [field]: value,
        },
      };

      const baseline = toEditableFields(product);
      const nextRow = nextDrafts[product.id];
      const isDirty =
        nextRow.wipCount !== baseline.wipCount ||
        nextRow.buildCount !== baseline.buildCount;

      setDirtyIds((currentDirtyIds) => {
        if (isDirty) {
          return currentDirtyIds.includes(product.id)
            ? currentDirtyIds
            : [...currentDirtyIds, product.id];
        }

        return currentDirtyIds.filter((id) => id !== product.id);
      });

      return nextDrafts;
    });
  };

  const handleSaveChanges = async () => {
    if (dirtyIds.length === 0) {
      showToast("Error", "No SKU changes to save", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await productService.bulkUpdateProducts({
        updates: dirtyIds.map((id) => ({
          id,
          wipCount: parseRequiredInt(drafts[id]?.wipCount ?? "0"),
          buildCount: parseRequiredInt(drafts[id]?.buildCount ?? "0"),
        })),
      });
      showToast("Success", "SKU values updated successfully", "success");
      await refreshLoadedPages();
    } catch (error: unknown) {
      showToast(
        "Error",
        getErrorMessage(error, "Failed to save SKU changes"),
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
              <h1 className="text-3xl font-bold">Edit Warehouse</h1>
              <p className="text-muted-foreground">
                Edit different values for each SKU, then save all changed rows.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/inventory/production">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={isSubmitting || dirtyCount === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting
                  ? "Saving..."
                  : `Save ${dirtyCount} Changed SKU${dirtyCount === 1 ? "" : "s"}`}
              </Button>
            </div>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => {
                      const draft = drafts[row.id] ?? toEditableFields(row);
                      const isDirty = dirtyIds.includes(row.id);

                      return (
                        <TableRow
                          key={row.id}
                          className={isDirty ? "bg-muted/30" : ""}
                        >
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>{row.inventoryType}</TableCell>
                          <TableCell className="font-medium">
                            {row.sku}
                          </TableCell>
                          <TableCell>{row.requiredQty}</TableCell>
                          <TableCell>{row.ggbNumber ?? 0}</TableCell>
                          <TableCell>{row.dealerNumber ?? 0}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={draft.wipCount}
                              onChange={(event) =>
                                handleDraftChange(
                                  row,
                                  "wipCount",
                                  event.target.value,
                                )
                              }
                              className="min-w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={draft.buildCount}
                              onChange={(event) =>
                                handleDraftChange(
                                  row,
                                  "buildCount",
                                  event.target.value,
                                )
                              }
                              className="min-w-24"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              <div className="flex justify-center">
                {canLoadMore ? (
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    All matching SKUs are loaded.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
