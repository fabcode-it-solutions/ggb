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
} from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import { logService, type LogFilters } from "@/services/log.service";
import { Log, LogType } from "@/types";
import { Search, FileText, Download, Eye } from "lucide-react";

export default function LogsPage() {
  const { showToast } = useToast();
  const { pagination, setPage, setTotalPages, setTotalCount } = usePagination({
    initialLimit: 20,
  });

  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogType, setSelectedLogType] = useState<LogType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchLogs();
  }, [
    pagination.page,
    debouncedSearchTerm,
    selectedLogType,
    startDate,
    endDate,
  ]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const filters: LogFilters = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm || undefined,
        type: selectedLogType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response = await logService.getLogs(filters);
      if (response.success && response.data && response.data.data) {
        setLogs(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.total);
        }
      }
    } catch (error: any) {
      showToast("Error", "Failed to load logs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLog = (log: Log) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filters: LogFilters = {
        type: selectedLogType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const blob = await logService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Success", "Logs exported successfully", "success");
    } catch (error: any) {
      showToast("Error", "Failed to export logs", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const getLogTypeColor = (type: LogType) => {
    const colors: Record<LogType, string> = {
      LOGIN: "bg-muted text-foreground",
      LOGOUT: "bg-muted text-foreground",
      CREATE: "bg-black text-white",
      UPDATE: "bg-muted text-foreground",
      DELETE: "bg-red-700 text-white",
      ERROR: "bg-red-700 text-white",
    };
    return colors[type] || "bg-muted text-foreground";
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap  gap-4">
            <div>
              <h1 className="text-3xl font-bold">System Logs</h1>
              <p className="text-muted-foreground">
                View and export system activity logs
              </p>
            </div>
            {/* <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Logs"}
            </Button> */}
          </div>

          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by action or note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedLogType}
                onValueChange={(value) =>
                  setSelectedLogType((value as LogType) || "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(LogType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </Card>

          {isLoading ? (
            <Loading />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No logs found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.no</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs &&
                      logs?.map((log, index) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {(pagination.page - 1) * pagination.limit +
                              index +
                              1}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium ${getLogTypeColor(
                                log.type
                              )}`}
                            >
                              {log.type}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.action}
                          </TableCell>
                          <TableCell>
                            {log.user
                              ? `${log.user.firstName} ${log.user.lastName}`
                              : "System"}
                          </TableCell>
                          <TableCell>
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

        {/* View Log Details Modal */}
        <Modal open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Log Details</ModalTitle>
              <ModalDescription>
                View detailed information about this log entry
              </ModalDescription>
            </ModalHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium mt-1 ${getLogTypeColor(
                      selectedLog.type
                    )}`}
                  >
                    {selectedLog.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Action</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.action}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.user
                      ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (${selectedLog.user.email})`
                      : "System"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedLog.note && (
                  <div>
                    <p className="text-sm font-medium">Note</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.note}
                    </p>
                  </div>
                )}
                {selectedLog.metadata && (
                  <div>
                    <p className="text-sm font-medium">Metadata</p>
                    <pre className="text-xs text-muted-foreground  bg-muted p-3 overflow-auto max-h-48 border border-border">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
