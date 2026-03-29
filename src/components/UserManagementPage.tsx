import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Eye,
  RefreshCw,
  Settings,
  Users,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Calendar,
  X,
  Lock,
  Save,
  EyeOff,
} from "lucide-react";
import { UserService } from "../services/userService";
import { AuthService } from "../services/authService";
import { PermissionService } from "../services/permissionService";
import { User as UserType, UserForm } from "../types";
import { UserWithPermissions } from "../types/permissions";
import { UserPermissionsModal } from "./UserPermissionsModal";
import { Permission } from "../types/permissions";
import { searchInArabicText } from "../utils/arabicUtils";
import { ConfirmationMessage } from "./ConfirmationMessage";
import { OperationService } from "../services/operationService";
import { testSupabaseConnection } from "../lib/supabase";
interface UserManagementPageProps {
  onPermissionsChange?: () => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  onPermissionsChange,
}) => {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "testing" | "connected" | "error"
  >("testing");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmationType, setConfirmationType] = useState<"success" | "error">(
    "success",
  );

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    loadUsers();
    loadPermissions();
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus("testing");

      const isConnected = await testSupabaseConnection();

      setConnectionStatus(isConnected ? "connected" : "error");
    } catch (error) {
      console.error("خطأ في اختبار الاتصال:", error);
      setConnectionStatus("error");
    }
  };
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 بدء تحميل المستخدمين...");
      const usersData = await PermissionService.getUsersWithPermissions();
      console.log("✅ تم تحميل المستخدمين بنجاح:", usersData.length);
      setUsers(usersData);
    } catch (err: any) {
      console.error("❌ خطأ في تحميل المستخدمين:", err);
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const permissionsData = await PermissionService.getAllPermissions();
      setPermissions(permissionsData);
      console.log(
        "✅ تم تحميل الصلاحيات في UserManagementPage:",
        permissionsData,
      ); // أضف هذا السطر
    } catch (err: any) {
      console.warn("تحذير: لا يمكن تحميل الصلاحيات:", err);
      // لا نعرض خطأ للمستخدم لأن هذا قد يكون طبيعياً إذا لم يتم إنشاء جداول الصلاحيات بعد
    }
  };
  const filteredUsers = users.filter(
    (user) =>
      searchInArabicText(user.full_name, searchTerm) ||
      searchInArabicText(user.username, searchTerm) ||
      searchInArabicText(user.email, searchTerm),
  );

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setShowUserForm(true);
  };

  const handleEditUser = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setIsEditing(true);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (user: UserWithPermissions) => {
    if (user.id === currentUser?.id) {
      alert("لا يمكنك حذف حسابك الخاص");
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.full_name}"؟`)) return;

    try {
      console.log("🔄 بدء حذف المستخدم:", user.username);
      await UserService.deleteUser(user.id);
      console.log("✅ تم حذف المستخدم بنجاح");

      // تسجيل العملية في سجل العمليات
      try {
        const description = `تم حذف المستخدم: ${user.full_name} (${user.username})`;
        console.log("🔄 بدء تسجيل العملية في السجل:", {
          operationType: "حذف مستخدم",
          description,
        });
        await OperationService.logOperation("حذف مستخدم", description);
        console.log("✅ تم تسجيل العملية في السجل بنجاح");
      } catch (operationError) {
        console.error("❌ خطأ في تسجيل العملية:", operationError);
        // لا نرمي الخطأ هنا لأن العملية الأساسية نجحت
      }

      await loadUsers();
    } catch (err: any) {
      alert(err instanceof Error ? err.message : "خطأ في حذف المستخدم");
    }
  };

  const handleManagePermissions = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const handlePermissionsSubmit = async (
    userId: string,
    permissionIds: string[],
  ) => {
    try {
      await PermissionService.grantMultiplePermissions(
        userId,
        permissionIds,
        currentUser?.id || "",
      );

      // تحديث بيانات المستخدم الحالي وصلاحياته بعد الحفظ
      if (currentUser && currentUser.id === userId) {
        await AuthService.refreshUserData();
        // إخبار App بتحديث القائمة الجانبية فوراً
        onPermissionsChange?.();
      }

      setShowPermissionsModal(false);
      setSelectedUser(null);
      await loadUsers();

      // إذا تم تغيير صلاحيات مستخدم آخر، أظهر رسالة تنبيه
      if (!currentUser || currentUser.id !== userId) {
        setConfirmationText("تم حفظ الصلاحيات بنجاح. يحتاج المستخدم إلى تسجيل الخروج وإعادة الدخول لتفعيل الصلاحيات الجديدة.");
        setConfirmationType("success");
        setShowConfirmation(true);
      }
    } catch (err: any) {
      throw err;
    }
  };
  const handleUserSubmit = async (userData: UserForm) => {
    try {
      setFormLoading(true);
      console.log("🔄 بدء حفظ المستخدم:", {
        ...userData,
        plain_password: "[مخفية]",
      });

      if (isEditing && selectedUser) {
        console.log("📝 تحديث مستخدم موجود:", selectedUser.id);
        await UserService.updateUser(selectedUser.id, userData);
        console.log("✅ تم تحديث المستخدم بنجاح");
        setConfirmationText("تم تحديث بيانات المستخدم بنجاح!");

        // تسجيل العملية في سجل العمليات
        try {
          const description = `تم تعديل بيانات المستخدم: ${userData.full_name} (${userData.username})`;
          console.log("🔄 بدء تسجيل العملية في السجل:", {
            operationType: "تعديل بيانات",
            description,
          });
          await OperationService.logOperation("تعديل بيانات", description);
          console.log("✅ تم تسجيل العملية في السجل بنجاح");
        } catch (operationError) {
          console.error("❌ خطأ في تسجيل العملية:", operationError);
          // لا نرمي الخطأ هنا لأن العملية الأساسية نجحت
        }
      } else {
        console.log("➕ إضافة مستخدم جديد");
        await UserService.createUser(userData);
        console.log("✅ تم إضافة المستخدم بنجاح");
        setConfirmationText("تم إضافة المستخدم بنجاح!");

        // تسجيل العملية في سجل العمليات
        try {
          const description = `تم إضافة مستخدم جديد: ${userData.full_name} (${userData.username})`;
          console.log("🔄 بدء تسجيل العملية في السجل:", {
            operationType: "إضافة مستخدم",
            description,
          });
          await OperationService.logOperation("إضافة مستخدم", description);
          console.log("✅ تم تسجيل العملية في السجل بنجاح");
        } catch (operationError) {
          console.error("❌ خطأ في تسجيل العملية:", operationError);
          // لا نرمي الخطأ هنا لأن العملية الأساسية نجحت
        }
      }

      setConfirmationType("success");
      setShowConfirmation(true);

      setShowUserForm(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error("❌ خطأ في حفظ المستخدم:", err);
      const errorMessage =
        err instanceof Error ? err.message : "خطأ في حفظ المستخدم";
      setConfirmationText(errorMessage);
      setConfirmationType("error");
      setShowConfirmation(true);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "مشرف عام";
      case "supervisor":
        return "مشرف";
      case "data_entry":
        return "مدخل بيانات";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "supervisor":
        return "bg-moe-100 text-moe-800";
      case "data_entry":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moe-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-moe-900" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              إدارة المستخدمين
            </h1>
            <p className="text-gray-600">إدارة المستخدمين في النظام</p>
            {/* مؤشر حالة الاتصال */}
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "error"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              ></div>
              <span className="text-xs text-gray-500">
                {connectionStatus === "connected"
                  ? "متصل"
                  : connectionStatus === "error"
                    ? "خطأ في الاتصال"
                    : "جاري الاختبار..."}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {(AuthService.hasPermission("users.create") ||
            AuthService.hasPermission("admin")) && (
            <button
              onClick={handleAddUser}
              disabled={connectionStatus !== "connected"}
              className="flex items-center gap-2 px-4 py-2 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة مستخدم
            </button>
          )}

          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>

          <button
            onClick={testConnection}
            disabled={connectionStatus === "testing"}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            اختبار الاتصال
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-moe-600" />
            <div>
              <p className="text-2xl font-bold text-moe-600">{users.length}</p>
              <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.role === "admin").length}
              </p>
              <p className="text-sm text-gray-600">مشرفين عامين</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-moe-600" />
            <div>
              <p className="text-2xl font-bold text-moe-600">
                {users.filter((u) => u.role === "supervisor").length}
              </p>
              <p className="text-sm text-gray-600">مشرفين</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.is_active).length}
              </p>
              <p className="text-sm text-gray-600">مستخدمين نشطين</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث في المستخدمين..."
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  المستخدم
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  الدور
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  الحالة
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  تاريخ الإنشاء
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    لا توجد مستخدمين
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-moe-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-moe-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                          {user.email && (
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(AuthService.hasSpecificPermission("users.edit") ||
                          AuthService.hasSpecificPermission("admin")) && (
                          <>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* زر إدارة الصلاحيات */}
                            {(AuthService.hasPermission("admin") ||
                              AuthService.hasSpecificPermission(
                                "users.manage_permissions",
                              )) && (
                              <button
                                onClick={() => handleManagePermissions(user)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="إدارة الصلاحيات"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}

                            {user.id !== currentUser?.id &&
                              (AuthService.hasSpecificPermission(
                                "users.delete",
                              ) ||
                                AuthService.hasSpecificPermission("admin")) && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-center text-gray-600">
        عرض {filteredUsers.length} من أصل {users.length} مستخدم
      </div>

      {connectionStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">
                مشكلة في الاتصال مع قاعدة البيانات
              </p>
              <p className="text-red-700 text-sm">
                تحقق من إعدادات Supabase ومتغيرات البيئة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserFormModal
          user={selectedUser}
          isEditing={isEditing}
          onSubmit={handleUserSubmit}
          onClose={() => {
            setShowUserForm(false);
            setSelectedUser(null);
          }}
          loading={formLoading}
        />
      )}

      {/* User Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <UserPermissionsModal
          user={selectedUser}
          permissions={permissions}
          onSubmit={handlePermissionsSubmit}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* رسالة التأكيد */}
      {showConfirmation && (
        <ConfirmationMessage
          message={confirmationText}
          type={confirmationType}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

// User Form Modal Component
interface UserFormModalProps {
  user?: UserWithPermissions | null;
  isEditing: boolean;
  onSubmit: (data: UserForm) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  isEditing,
  onSubmit,
  onClose,
  loading = false,
}) => {
  const [formData, setFormData] = useState<UserForm>({
    username: "",
    plain_password: "",
    role: "data_entry",
    full_name: "",
    email: "",
    is_active: true,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        username: user.username,
        plain_password: "",
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        is_active: user.is_active,
      });
      setConfirmPassword("");
    }
  }, [user, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.full_name.trim()) {
      setError("اسم المستخدم والاسم الكامل مطلوبان");
      return;
    }

    // التحقق من كلمة المرور للمستخدمين الجدد
    if (!isEditing) {
      if (!formData.plain_password) {
        setError("كلمة المرور مطلوبة للمستخدمين الجدد");
        return;
      }
      if (formData.plain_password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
      }
      if (formData.plain_password !== confirmPassword) {
        setError("كلمة المرور وتأكيدها غير متطابقتين");
        return;
      }
    }

    // للتعديل: التحقق من كلمة المرور إذا تم إدخالها
    if (isEditing && formData.plain_password) {
      if (formData.plain_password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
      }
      if (formData.plain_password !== confirmPassword) {
        setError("كلمة المرور وتأكيدها غير متطابقتين");
        return;
      }
    }
    try {
      setError(null);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "خطأ في حفظ المستخدم");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    setError(null);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setConfirmPassword(e.target.value);
    setError(null);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* المعلومات الأساسية */}
          <div className="bg-moe-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              المعلومات الأساسية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="أدخل اسم المستخدم"
                />
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    لا يمكن تغيير اسم المستخدم بعد الإنشاء
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الدور *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                >
                  <option value="data_entry">مدخل بيانات</option>
                  <option value="supervisor">مشرف</option>
                  <option value="admin">مشرف عام</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              معلومات الاتصال
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                  placeholder="أدخل البريد الإلكتروني (اختياري)"
                />
              </div>
            </div>
          </div>

          {/* كلمة المرور */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {isEditing ? "تغيير كلمة المرور" : "كلمة المرور"}
            </h3>

            {isEditing && (
              <div className="bg-moe-100 border border-moe-200 rounded-lg p-3 mb-4">
                <p className="text-moe-800 text-sm">
                  اتركه فارغاً إذا كنت لا تريد تغيير كلمة المرور
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور {!isEditing && "*"}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="plain_password"
                    value={formData.plain_password}
                    onChange={handleChange}
                    required={!isEditing}
                    className="w-full pr-10 pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                    placeholder={
                      isEditing
                        ? "اتركه فارغاً لعدم التغيير"
                        : "أدخل كلمة المرور"
                    }
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    يجب أن تكون 6 أحرف على الأقل
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تأكيد كلمة المرور{" "}
                  {(!isEditing || formData.plain_password) && "*"}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required={!isEditing || !!formData.plain_password}
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                    placeholder="أعد إدخال كلمة المرور"
                  />
                </div>
                {formData.plain_password &&
                  confirmPassword &&
                  formData.plain_password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      كلمة المرور غير متطابقة
                    </p>
                  )}
                {formData.plain_password &&
                  confirmPassword &&
                  formData.plain_password === confirmPassword && (
                    <p className="text-xs text-green-500 mt-1">
                      كلمة المرور متطابقة ✓
                    </p>
                  )}
              </div>
            </div>

            {!isEditing && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  متطلبات كلمة المرور:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li
                    className={`flex items-center gap-2 ${(formData.plain_password?.length ?? 0) >= 6 ? "text-green-600" : ""}`}
                  >
                    {(formData.plain_password?.length ?? 0) >= 6 ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    6 أحرف على الأقل
                  </li>
                  <li
                    className={`flex items-center gap-2 ${(formData.plain_password ?? "") === confirmPassword && formData.plain_password ? "text-green-600" : ""}`}
                  >
                    {(formData.plain_password ?? "") === confirmPassword &&
                    formData.plain_password ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    تطابق كلمة المرور
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* الحالة */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-moe-600 border-gray-300 rounded focus:ring-moe-500"
              />
              <label className="text-sm font-medium text-gray-700">
                المستخدم نشط
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 mr-7">
              المستخدمون غير النشطين لا يمكنهم تسجيل الدخول
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-moe-600 text-white py-3 px-6 rounded-lg hover:bg-moe-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading
                ? "جاري الحفظ..."
                : isEditing
                  ? "تحديث المستخدم"
                  : "إضافة المستخدم"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
