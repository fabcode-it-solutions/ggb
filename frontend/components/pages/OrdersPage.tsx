"use client";
// components/pages/OrdersPage.tsx

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/hooks/useToast";
import {
  orderService,
  type Order,
  type OrderStatus,
  type OrderStats,
  type OrderFilters,
  type ReleasedFilter,
  type CreateOrderPayload,
} from "@/services/order.service";
import { OrderForm } from "@/components/orders/OrderForm";
import type { PaginationMeta } from "@/types";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  X,
  Send,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  PROCESSING: {
    label: "Processing",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  FULFILLED: {
    label: "Fulfilled",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-[#f2f2f2] last:border-0">
      <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-900 flex-1 break-words">
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: "warning" | "danger";
}) {
  const bg =
    highlight === "danger"
      ? "bg-red-50 border-red-200"
      : highlight === "warning"
        ? "bg-yellow-50 border-yellow-200"
        : "bg-white border-[#f2f2f2]";
  const tc =
    highlight === "danger"
      ? "text-red-700"
      : highlight === "warning"
        ? "text-yellow-700"
        : "text-gray-900";

  return (
    <div className={`border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${tc}`} />
      </div>
      <div className={`text-2xl font-bold ${tc}`}>{value}</div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onRelease,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
  onRelease: (id: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const addr = order.shippingAddress;
  const sc = STATUS_CONFIG[order.status];
  const isReleased = Boolean(order.shopifyOrderId);
  const hasSyncError = Boolean(order.shopifySyncError);

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true);
    await onStatusChange(order.id, status);
    setUpdating(false);
    onClose();
  };

  const handleRelease = async () => {
    setReleasing(true);
    await onRelease(order.id);
    setReleasing(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f2] shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            Order {order.orderNo}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
          {/* Shopify sync status */}
          {hasSyncError ? (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-700">
              <strong>Shopify sync failed:</strong> {order.shopifySyncError}
            </div>
          ) : isReleased ? (
            <div className="px-4 py-2.5 bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>
                Released as{" "}
                <strong className="font-mono">{order.shopifyOrderName}</strong>
              </span>
              {order.shopifyOrderId && (
                <span className="ml-auto text-xs font-mono text-green-600 truncate max-w-[200px]">
                  {order.shopifyOrderId}
                </span>
              )}
            </div>
          ) : (
            <div className="hidden px-4 py-4 bg-blue-50 border border-blue-200 text-sm text-blue-800 space-y-3">
              <p>
                <strong>Not yet released to Shopify.</strong>
                <br />
                <span className="text-xs opacity-80">
                  Click below when ready for it to appear in Shopify.
                </span>
              </p>
              <button
                onClick={handleRelease}
                disabled={releasing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-black text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                {releasing ? "Releasing…" : "Release Order to Shopify"}
              </button>
            </div>
          )}

          {/* Order Info */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
              Order Info
            </h3>
            <DetailRow
              label="Order No"
              value={<code className="font-mono">{order.orderNo}</code>}
            />

            <DetailRow
              label="Status"
              value={
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}
                >
                  {sc.label}
                </span>
              }
            />
            <DetailRow
              label="Created"
              value={new Date(order.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            />
          </section>

          {/* Line Items */}
          {(() => {
            const lineItems =
              order.lineItems?.length > 0
                ? order.lineItems
                : [{ sku: order.sku, quantity: order.quantity, price: "" }];
            return (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Line Items ({lineItems.length})
                </h3>
                <div className="mt-1 border border-[#f2f2f2] divide-y divide-[#f2f2f2]">
                  {lineItems.map((item, i) => (
                    <div key={i} className="px-3 py-2.5 flex flex-col gap-1">
                      <div className="flex items-center gap-4">
                        <code className="font-mono text-xs font-semibold text-gray-900 flex-1">
                          {item.sku}
                        </code>
                        <span className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </span>
                        {item.price ? (
                          <span className="text-xs font-semibold">
                            ${item.price}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">
                            Catalog price
                          </span>
                        )}
                      </div>
                      {(item.ggbNumber != null ||
                        item.dealerNumber != null ||
                        item.wipCount != null ||
                        item.buildCount != null ||
                        item.inventoryCount != null) && (
                        <div className="flex gap-4 text-xs text-gray-500">
                          {item.ggbNumber != null && (
                            <span>
                              GGB:{" "}
                              <strong className="text-gray-700">
                                {item.ggbNumber}
                              </strong>
                            </span>
                          )}
                          {item.dealerNumber != null && (
                            <span>
                              TCB:{" "}
                              <strong className="text-gray-700">
                                {item.dealerNumber}
                              </strong>
                            </span>
                          )}
                          <span>
                            Pre-Order:{" "}
                            <strong className="text-gray-700">
                              {item.quantity}
                            </strong>
                          </span>

                          {item.dealerNumber != null &&
                            item.ggbNumber != null && (
                              <span>
                                Total Inv:{" "}
                                <strong className="text-gray-700">
                                  {item.ggbNumber + item.dealerNumber}
                                </strong>
                              </span>
                            )}

                          {item.ggbNumber != null &&
                            item.dealerNumber != null && (
                              <span>
                                Req&apos;d:
                                <strong className="text-gray-700">
                                  {Math.max(
                                    item.quantity -
                                      (item.ggbNumber + item.dealerNumber),
                                    0,
                                  )}
                                </strong>
                              </span>
                            )}
                          {item.inventoryCount != null && (
                            <span>
                              Inventory:{" "}
                              <strong className="text-gray-700">
                                {item.inventoryCount}
                              </strong>
                            </span>
                          )}
                          {item.wipCount != null && (
                            <span>
                              WIP:{" "}
                              <strong className="text-gray-700">
                                {item.wipCount}
                              </strong>
                            </span>
                          )}
                          {item.buildCount != null && (
                            <span>
                              Build:{" "}
                              <strong className="text-gray-700">
                                {item.buildCount}
                              </strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Customer */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
              Customer
            </h3>
            <DetailRow label="Name" value={order.customerName} />
            <DetailRow label="Email" value={order.customerEmail} />
          </section>

          {/* Shipping */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
              Shipping Address
            </h3>
            <DetailRow
              label="Address"
              value={
                <span className="leading-relaxed">
                  {addr.address1}
                  {addr.address2 ? `, ${addr.address2}` : ""}
                  <br />
                  {addr.city}, {addr.province} {addr.zip}
                  <br />
                  {addr.country}
                </span>
              }
            />
          </section>

          {/* Tags */}
          {order.orderTags.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {order.orderTags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-black text-white text-xs font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {order.notes && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {order.notes}
              </p>
            </section>
          )}

          {/* Update status */}
          <section className="pt-4 border-t border-[#f2f2f2]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Update Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as OrderStatus[])
                .filter((s) => s !== order.status)
                .map((s) => (
                  <button
                    key={s}
                    disabled={updating || releasing}
                    onClick={() => handleStatusChange(s)}
                    className="px-3 py-1.5 text-xs font-semibold border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                  >
                    Mark as {STATUS_CONFIG[s].label}
                  </button>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Create Order Modal ───────────────────────────────────────────────────────

function CreateOrderModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: CreateOrderPayload) => Promise<void>;
  isSubmitting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f2] shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            Create New Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <OrderForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isSubmitting ? "Saving…" : "Save Order"}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  order,
  onClose,
  onConfirm,
  isDeleting,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f2f2]">
          <h2 className="text-base font-bold text-gray-900">Delete Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 mb-2">
            Are you sure you want to delete order{" "}
            <strong className="font-mono">{order.orderNo}</strong>?
          </p>
          {order.shopifyOrderName && (
            <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
              This order is linked to Shopify order{" "}
              <strong className="font-mono">{order.shopifyOrderName}</strong>.
              Deleting here will <strong>not</strong> cancel it in Shopify.
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-[#f2f2f2] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 20,
    search: "",
    status: "",
    released: "",
  });

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const unreleasedOnPage = orders.filter(
    (o) => !o.shopifyOrderId && !o.shopifySyncError,
  );
  const allUnreleasedSelected =
    unreleasedOnPage.length > 0 &&
    unreleasedOnPage.every((o) => selectedIds.has(o.id));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (f: OrderFilters) => {
      setIsLoading(true);
      try {
        const res = await orderService.getOrders(f);
        if (res.success && res.data) {
          setOrders(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch {
        showToast("Error", "Failed to load orders", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await orderService.getOrderStats();
      if (res.success && res.data) setStats(res.data);
    } catch {
      // stats failure is non-critical
    }
  }, []);

  useEffect(() => {
    fetchOrders(filters);
    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.page]);

  // ── Search (debounced) ──────────────────────────────────────────────────────
  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrders({ ...filters, search: value, page: 1 });
    }, 300);
  };

  const handleStatusFilter = (value: string) => {
    const updated = { ...filters, status: value as OrderStatus | "", page: 1 };
    setFilters(updated);
    fetchOrders(updated);
  };

  const handleReleasedFilter = (value: ReleasedFilter) => {
    const updated = { ...filters, released: value, page: 1 };
    setFilters(updated);
    fetchOrders(updated);
  };

  const clearFilters = () => {
    const reset: OrderFilters = {
      page: 1,
      limit: 20,
      search: "",
      status: "",
      released: "",
    };
    setFilters(reset);
    fetchOrders(reset);
  };

  const handlePageChange = (page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetchOrders(updated);
  };

  // ── Status update ───────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      const res = await orderService.updateOrderStatus(id, status);
      if (res.success) {
        showToast(
          "Success",
          `Order marked as ${STATUS_CONFIG[status].label}`,
          "success",
        );
        fetchOrders(filters);
        fetchStats();
      }
    } catch {
      showToast("Error", "Failed to update order status", "error");
    }
  };

  // ── Release single ──────────────────────────────────────────────────────────
  const handleRelease = async (id: string) => {
    setIsReleasing(true);
    try {
      const res = await orderService.releaseOrder(id);
      if (res.success) {
        const name = res.data?.shopifyOrderName;
        showToast(
          "Success",
          name ? `Released as ${name}` : "Order released to Shopify",
          "success",
        );
        fetchOrders(filters);
        fetchStats();
      }
    } catch {
      showToast("Error", "Failed to release order", "error");
    } finally {
      setIsReleasing(false);
    }
  };

  // ── Bulk release ────────────────────────────────────────────────────────────
  const handleBulkRelease = async () => {
    if (!selectedIds.size) return;
    setIsReleasing(true);
    try {
      const res = await orderService.bulkRelease([...selectedIds]);
      if (res.success && res.data) {
        const { released, failed } = res.data;
        showToast(
          failed > 0 ? "Warning" : "Success",
          `${released} released${failed > 0 ? `, ${failed} failed` : ""}`,
          failed > 0 ? "warning" : "success",
        );
        setSelectedIds(new Set());
        fetchOrders(filters);
        fetchStats();
      }
    } catch {
      showToast("Error", "Bulk release failed", "error");
    } finally {
      setIsReleasing(false);
    }
  };

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (payload: CreateOrderPayload) => {
    setIsCreating(true);
    try {
      const res = await orderService.createOrder(payload);
      if (res.success) {
        showToast("Success", "Order created successfully", "success");
        setShowCreate(false);
        fetchOrders(filters);
        fetchStats();
      }
    } catch {
      showToast("Error", "Failed to create order", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await orderService.deleteOrder(deleteTarget.id);
      if (res.success) {
        showToast("Success", "Order deleted", "success");
        setDeleteTarget(null);
        fetchOrders(filters);
        fetchStats();
      }
    } catch {
      showToast("Error", "Failed to delete order", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Selection helpers ───────────────────────────────────────────────────────
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allUnreleasedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unreleasedOnPage.map((o) => o.id)));
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const hasActiveFilter = !!(
    filters.search ||
    filters.status ||
    filters.released
  );

  const inputCls =
    "px-3 py-2 text-sm border border-[#f2f2f2] bg-white text-gray-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors";

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* ── Page header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Orders</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Orders created via the Shopify embedded app
              </p>
            </div>
            <button
              onClick={() => {
                fetchOrders(filters);
                fetchStats();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-[#f2f2f2] hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* ── Stats ── */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total" value={stats.total} icon={ShoppingCart} />
              <StatCard
                label="Pending"
                value={stats.pending}
                icon={Clock}
                highlight={stats.pending > 0 ? "warning" : undefined}
              />
              <StatCard
                label="Released"
                value={stats.released}
                icon={CheckCircle}
              />
              <StatCard
                label="Not Released"
                value={stats.unreleased}
                icon={Send}
                highlight={stats.unreleased > 0 ? "warning" : undefined}
              />
              <StatCard
                label="Sync Error"
                value={stats.syncError}
                icon={AlertCircle}
                highlight={stats.syncError > 0 ? "danger" : undefined}
              />
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute z-[1] left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className={`${inputCls} pl-9 w-full`}
                  placeholder="Search orders, SKUs, customers…"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value.trim())}
                />
              </div>
              <select
                className={inputCls}
                value={filters.released ?? ""}
                onChange={(e) =>
                  handleReleasedFilter(e.target.value as ReleasedFilter)
                }
              >
                <option value="">All orders</option>
                <option value="unreleased">Not released</option>
                <option value="released">Released</option>
                <option value="error">Sync error</option>
              </select>
              <select
                className={inputCls}
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 items-center shrink-0">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkRelease}
                  disabled={isReleasing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Send className="h-4 w-4" />
                  {isReleasing
                    ? "Releasing…"
                    : `Release Selected (${selectedIds.size})`}
                </button>
              )}
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2 hidden bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors whitespace-nowrap"
              >
                + New Order
              </button>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="flex items-center gap-4 text-sm text-gray-400 border-b border-[#f2f2f2] pb-3">
            <span>
              <strong className="text-gray-900">
                {pagination?.total ?? 0}
              </strong>{" "}
              total
            </span>
            {pagination && (
              <span>
                Page <strong className="text-gray-900">{filters.page}</strong> /{" "}
                <strong className="text-gray-900">
                  {pagination.totalPages}
                </strong>
              </span>
            )}
            {selectedIds.size > 0 && (
              <span className="text-emerald-700 font-semibold">
                {selectedIds.size} selected
              </span>
            )}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-black underline hover:no-underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* ── Table ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 border border-[#f2f2f2]">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">
                Loading orders…
              </span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 border border-[#f2f2f2]">
              <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#f2f2f2]">
              <table className="w-full text-sm">
                <thead className="bg-[#f9f9f9] border-b border-[#f2f2f2]">
                  <tr>
                    {/* Select-all checkbox */}
                    <th className="px-3 py-3 hidden w-8">
                      <input
                        type="checkbox"
                        checked={allUnreleasedSelected}
                        onChange={toggleSelectAll}
                        disabled={unreleasedOnPage.length === 0}
                        className="cursor-pointer disabled:opacity-30"
                        title="Select all unreleased"
                      />
                    </th>
                    {[
                      "#",
                      "Order No",
                      "Shopify",
                      "Customer",
                      "Tags",
                      "Status",
                      "Created",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2]">
                  {orders.map((order, idx) => {
                    const sc = STATUS_CONFIG[order.status];
                    const hasSyncError = Boolean(order.shopifySyncError);
                    const isReleased = Boolean(order.shopifyOrderId);
                    const isUnreleased = !isReleased && !hasSyncError;
                    const isChecked = selectedIds.has(order.id);
                    const rowNum =
                      ((filters.page ?? 1) - 1) * (filters.limit ?? 20) +
                      idx +
                      1;

                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors ${isChecked ? "bg-emerald-50" : "bg-white hover:bg-[#fafafa]"}`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-3 hidden">
                          {isUnreleased && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelected(order.id)}
                              className="cursor-pointer"
                            />
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">
                          {rowNum}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                          {order.orderNo}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {hasSyncError ? (
                            <span
                              title={order.shopifySyncError ?? ""}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium cursor-help"
                            >
                              <AlertCircle className="h-3 w-3" /> Sync error
                            </span>
                          ) : isReleased ? (
                            <span className="inline-block px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs font-mono font-semibold">
                              {order.shopifyOrderName}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 bg-gray-50 border border-gray-200 text-gray-400 text-xs">
                              Not released
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-900 leading-tight">
                            {order.customerName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.customerEmail}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[120px]">
                            {order.orderTags.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs"
                              >
                                {t}
                              </span>
                            ))}
                            {order.orderTags.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{order.orderTags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}
                          >
                            {sc.label}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isUnreleased && (
                              <button
                                onClick={() => handleRelease(order.id)}
                                disabled={isReleasing}
                                className="p-1 text-emerald-700 hidden hover:text-emerald-900 disabled:opacity-50 transition-colors"
                                title="Release to Shopify"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setViewOrder(order)}
                              className="p-1 text-gray-500 hover:text-black transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(order)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              title="Delete order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <button
                disabled={(filters.page ?? 1) <= 1}
                onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm border border-[#f2f2f2] disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-gray-500">
                {filters.page} / {pagination.totalPages}
                <span className="ml-2 text-gray-400">
                  ({pagination.total} orders)
                </span>
              </span>
              <button
                disabled={(filters.page ?? 1) >= pagination.totalPages}
                onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm border border-[#f2f2f2] disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Modals ── */}
        {showCreate && (
          <CreateOrderModal
            onClose={() => setShowCreate(false)}
            onSubmit={handleCreate}
            isSubmitting={isCreating}
          />
        )}

        {viewOrder && (
          <OrderDetailModal
            order={viewOrder}
            onClose={() => setViewOrder(null)}
            onStatusChange={handleStatusChange}
            onRelease={handleRelease}
          />
        )}

        {deleteTarget && (
          <DeleteConfirmModal
            order={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
