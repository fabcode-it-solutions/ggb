"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import { userService, type CreateUserRequest } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import { User, Role } from "@/types";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/lib/validations/user.schema";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users as UsersIcon,
  Shield,
} from "lucide-react";

type TabType = "users" | "roles";
type FilterType = "all" | "true" | "false";
const Filter_Type: FilterType[] = ["true", "false"];
export default function RolesUsersPage() {
  const { showToast } = useToast();
  const { pagination, setPage, setTotalPages, setTotalCount } = usePagination({
    initialLimit: 10,
  });
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateUserInput>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleIds: [],
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CreateUserInput, string>>
  >({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, pagination.page, debouncedSearchTerm, activeFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchTerm || undefined,
        isActive:
          activeFilter === "all"
            ? undefined : activeFilter === "true"
            ? true
            : false,
      });
      if (response.success && response.data) {
        setUsers(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.total);
        }
      }
    } catch (error: any) {
      showToast("Error", "Failed to load users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles({});
      if (response.success && response.data) {
        setRoles(response.data);
      }
    } catch (error: any) {
      showToast("Error", "Failed to load roles", "error");
    }
  };

  const handleCreateUser = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleIds: [],
    });
    setFormErrors({});
    setIsCreateUserModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof CreateUserInput]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleChange = (roleId: string) => {
    setFormData((prev) => {
      return { ...prev, roleIds: [roleId] };
    });
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    const validation = createUserSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CreateUserInput, string>> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          const field = issue.path[0] as keyof CreateUserInput;
          fieldErrors[field] = issue.message;
        }
      });

      setFormErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await userService.createUser(formData as CreateUserRequest);
      showToast("Success", "User created successfully", "success");
      setIsCreateUserModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      if (error.response.data.error) {
        showToast(
          "Error",
          error.response.data.error || "Failed to create product",
          "error"
        );
      } else {
        showToast(
          "Error",
          error.message || "Failed to create product",
          "error"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await userService.deleteUser(selectedUser.id);
      showToast("Success", "User deleted successfully", "success");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      if (error.response.data.error) {
        showToast(
          "Error",
          error.response.data.error || "Failed to create product",
          "error"
        );
      } else {
        showToast("Error", error.message || "Failed to delete user", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await userService.toggleUserStatus(userId, !currentStatus);
      showToast("Success", "User status updated successfully", "success");
      fetchUsers();
    } catch (error: any) {
      showToast("Error", "Failed to update user status", "error");
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap  gap-4">
            <div>
              <h1 className="text-3xl font-bold">Roles & Users</h1>
              <p className="text-muted-foreground">
                Manage system users and their roles
              </p>
            </div>
            {activeTab === "users" && (
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            )}
          </div>

          <div className="border-b border-border">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "users"
                    ? "border-black text-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <UsersIcon className="h-4 w-4" />
                Users
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "roles"
                    ? "border-black text-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4" />
                Roles
              </button>
            </nav>
          </div>

          {activeTab === "users" && (
            <>
              <Card className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                       <div className="flex flex-wrap gap-2 mt-2">
                              <Button
                                onClick={() => setActiveFilter("all")}
                                variant={activeFilter == "all" ? "default" : "outline"}
                              >
                                All
                              </Button>
                              {Filter_Type.map((type) => (
                                <Button
                                  onClick={() =>
                                    setActiveFilter((type as FilterType) || "")
                                  }
                                  variant={activeFilter == type ? "default" : "outline"}
                                  key={type}
                                >
                                  {type === "true" ? "Active" : "Inactive"}
                                </Button>
                              ))}
                            </div>
              </Card>

              {isLoading ? (
                <Loading />
              ) : users.length === 0 ? (
                <EmptyState
                  icon={UsersIcon}
                  title="No users found"
                  description="Try adjusting your search or create a new user"
                  action={
                    <Button onClick={handleCreateUser}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  }
                />
              ) : (
                <>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>S.no</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user, index) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {(pagination.page - 1) * pagination.limit +
                                index +
                                1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.userRoles
                                ?.map((ur) => ur?.role?.name)
                                .join(", ") || "-"}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() =>
                                  toggleUserStatus(user.id, user.isActive)
                                }
                                className={`text-sm px-2 py-1 border ${
                                  user.isActive
                                    ? "border-border bg-white text-foreground"
                                    : "border-border bg-muted text-muted-foreground"
                                }`}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </button>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {users.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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
            </>
          )}

          {activeTab === "roles" && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.no</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role, index) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.type}</TableCell>
                      <TableCell>{role.description || "-"}</TableCell>
                      <TableCell>
                        {Object.entries(role.permissions)
                          .filter(([, value]) => value)
                          .map(([key]) => key)
                          .join(", ") || "None"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Create User Modal */}
        <Modal
          open={isCreateUserModalOpen}
          onOpenChange={setIsCreateUserModalOpen}
        >
          <ModalContent className="max-w-md">
            <ModalHeader>
              <ModalTitle>Add New User</ModalTitle>
              <ModalDescription>Create a new user account</ModalDescription>
            </ModalHeader>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                error={formErrors.firstName}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                error={formErrors.lastName}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                error={formErrors.email}
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                error={formErrors.password}
                required
              />
              <div>
                <label className="block text-sm font-medium mb-2">
                  Roles *
                </label>
                <div className="space-y-2 border border-border p-3">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="role"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
                </div>
                {formErrors.roleIds && (
                  <p className="text-sm text-black mt-1">
                    {formErrors.roleIds}
                  </p>
                )}
              </div>
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateUserModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Delete User</ModalTitle>
              <ModalDescription>
                Are you sure you want to delete user "{selectedUser?.firstName}{" "}
                {selectedUser?.lastName}"? This action cannot be undone.
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
