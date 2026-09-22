"use client";

import { useEffect, useState } from "react";
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
  webhookService,
  type WebhookFilters,
} from "@/services/webhook.service";
import { WebhookTrigger, WebhookStatus } from "@/types";
import { Search, Webhook, RefreshCw, Eye, Trash2 } from "lucide-react";

export default function WebhooksPage() {
  const { showToast } = useToast();
  const { pagination, setPage, setTotalPages, setTotalCount } = usePagination({
    initialLimit: 10,
  });

  const [webhooks, setWebhooks] = useState<WebhookTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<WebhookStatus | "">("");
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookTrigger | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRetriggering, setIsRetriggering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchWebhooks();
  }, [pagination.page, debouncedSearchTerm, selectedStatus]);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const filters: WebhookFilters = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm || undefined,
        status: selectedStatus || undefined,
      };

      const response = await webhookService.getWebhooks(filters);

      if (response.success && response.data) {
        setWebhooks(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.total);
        }
      }
    } catch (error: any) {
      showToast("Error", "Failed to load webhooks", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewWebhook = (webhook: WebhookTrigger) => {
    setSelectedWebhook(webhook);
    setIsViewModalOpen(true);
  };

  const handleDeleteWebhook = (webhook: WebhookTrigger) => {
    setSelectedWebhook(webhook);
    setIsDeleteModalOpen(true);
  };

  const handleRetrigger = async (id: string) => {
    setIsRetriggering(true);
    try {
      await webhookService.retriggerWebhook(id);
      showToast("Success", "Webhook retriggered successfully", "success");
      fetchWebhooks();
    } catch (error: any) {
      showToast("Error", "Failed to retrigger webhook", "error");
    } finally {
      setIsRetriggering(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedWebhook) return;

    setIsDeleting(true);
    try {
      await webhookService.deleteWebhook(selectedWebhook.id);
      showToast("Success", "Webhook deleted successfully", "success");
      setIsDeleteModalOpen(false);
      fetchWebhooks();
    } catch (error: any) {
      showToast("Error", "Failed to delete webhook", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: WebhookStatus) => {
    return status === WebhookStatus.UPDATED
      ? "bg-muted text-foreground"
      : "bg-black text-white";
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Webhook Triggers</h1>
            <p className="text-muted-foreground">
              Manage and retrigger webhook events
            </p>
          </div>

          <Card className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute  z-[1] left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus((value as WebhookStatus) || "")
                }
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(WebhookStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {isLoading ? (
            <Loading />
          ) : webhooks.length === 0 ? (
            <EmptyState
              icon={Webhook}
              title="No webhooks found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Last Attempt</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell className="font-medium">
                          {webhook.orderId}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium ${getStatusColor(
                              webhook.status,
                            )}`}
                          >
                            {webhook.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell>{webhook.attempts}</TableCell>
                        <TableCell>
                          {webhook.lastAttemptAt
                            ? new Date(webhook.lastAttemptAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(webhook.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewWebhook(webhook)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* {webhook.status === WebhookStatus.NOT_UPDATED && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRetrigger(webhook.id)}
                                disabled={isRetriggering}
                                title="Retrigger"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )} */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteWebhook(webhook)}
                              title="Delete"
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

        {/* View Webhook Details Modal */}
        <Modal open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Webhook Details</ModalTitle>
              <ModalDescription>
                View detailed information about this webhook
              </ModalDescription>
            </ModalHeader>
            {selectedWebhook && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Order ID</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedWebhook.orderId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium mt-1 ${getStatusColor(
                      selectedWebhook.status,
                    )}`}
                  >
                    {selectedWebhook.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Attempts</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedWebhook.attempts}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedWebhook.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Attempt</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedWebhook.lastAttemptAt
                      ? new Date(selectedWebhook.lastAttemptAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                {selectedWebhook.errorMessage && (
                  <div>
                    <p className="text-sm font-medium">Error Message</p>
                    <p className="text-sm text-black bg-muted p-3 border border-border">
                      {selectedWebhook.errorMessage}
                    </p>
                  </div>
                )}
                {selectedWebhook.responseData && (
                  <div>
                    <p className="text-sm font-medium">Response Data</p>
                    <pre className="text-xs text-muted-foreground  bg-muted p-3 overflow-auto max-h-48 border border-border">
                      {JSON.stringify(selectedWebhook.responseData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {/* <ModalFooter>
              {selectedWebhook?.status === WebhookStatus.NOT_UPDATED && (
                <Button
                  onClick={() => {
                    if (selectedWebhook) {
                      handleRetrigger(selectedWebhook.id);
                      setIsViewModalOpen(false);
                    }
                  }}
                  disabled={isRetriggering}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isRetriggering ? "Retriggering..." : "Retrigger"}
                </Button>
              )}
            </ModalFooter> */}
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Delete Webhook</ModalTitle>
              <ModalDescription>
                Are you sure you want to delete webhook for order "
                {selectedWebhook?.orderId}"? This action cannot be undone.
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
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
