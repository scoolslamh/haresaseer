import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  X,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";
import { GuardService } from "../services/guardService";
import { SchoolService } from "../services/schoolService";
import { Guard, School, GuardFilters } from "../types";
import { AuthService } from "../services/authService";
import { GuardForm } from "./GuardForm";
import { AddSchoolModal } from "./AddSchoolModal";
import { GuardDetailsModal } from "./GuardDetailsModal";
import { ExportService } from "../services/exportService";
import { Pagination } from "./Pagination";
import { normalizeArabicText } from "../utils/arabicUtils";
import { ConfirmationMessage } from "./ConfirmationMessage";
import { OperationService } from "../services/operationService";

interface DataManagementModalProps {
  onClose: () => void;
  onDataChange: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  onClose,
  onDataChange,
}) => {
  const [activeTab, setActiveTab] = useState<"guards" | "schools">("guards");

  // حالات الحراس
  const [guards, setGuards] = useState<Guard[]>([]);
  const [totalGuardsCount, setTotalGuardsCount] = useState(0);
  const [guardCurrentPage, setGuardCurrentPage] = useState(1);
  const [guardItemsPerPage, setGuardItemsPerPage] = useState(10);
  const [guardFilters, setGuardFilters] = useState<GuardFilters>({
    search: "",
    region: "all",
    governorate: "all",
    gender: "all",
    insurance: "all",
    status: "all",
  });

  // حالات المدارس
  const [schools, setSchools] = useState<School[]>([]);
  const [totalSchoolsCount, setTotalSchoolsCount] = useState(0);
  const [schoolCurrentPage, setSchoolCurrentPage] = useState(1);
  const [schoolItemsPerPage, setSchoolItemsPerPage] = useState(10);
  const [schoolFilters, setSchoolFilters] = useState({
    search: "",
    region: "all",
    status: "all",
  });

  // حالات عامة
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGuardForm, setShowGuardForm] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [showGuardDetails, setShowGuardDetails] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [exporting, setExporting] = useState(false);
  const [localGuardSearch, setLocalGuardSearch] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');
  const [localSchoolSearch, setLocalSchoolSearch] = useState("");
  const [guardsList, setGuardsList] = useState<any[]>([]);
  const [guardsLoading, setGuardsLoading] = useState(false);
  const [showSchoolGuardsModal, setShowSchoolGuardsModal] = useState(false);
  // تحميل البيانات عند تغيير الفلاتر أو التبويب
  useEffect(() => {
    loadData();
  }, [
    activeTab,
    guardFilters,
    guardCurrentPage,
    guardItemsPerPage,
    schoolFilters,
    schoolCurrentPage,
    schoolItemsPerPage,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "guards") {
        const guardsResult = await GuardService.getFilteredGuards(
          guardFilters,
          guardCurrentPage,
          guardItemsPerPage,
        );
        setGuards(guardsResult.guards);
        setTotalGuardsCount(guardsResult.totalCount);
      } else {
        const schoolsResult = await SchoolService.getFilteredSchools(
          schoolFilters,
          schoolCurrentPage,
          schoolItemsPerPage,
        );
        setSchools(schoolsResult.schools);
        setTotalSchoolsCount(schoolsResult.totalCount);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // معالجة البحث للحراس
  const handleGuardSearchSubmit = () => {
    handleGuardFilterChange("search", localGuardSearch);
  };

  const handleGuardSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGuardSearchSubmit();
    }
  };

  // معالجة البحث للمدارس
  const handleSchoolSearchSubmit = () => {
    handleSchoolFilterChange("search", localSchoolSearch);
  };

  const handleSchoolSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSchoolSearchSubmit();
    }
  };

  // معالجات الفلاتر للحراس
  const handleGuardFilterChange = (key: keyof GuardFilters, value: string) => {
    setGuardFilters((prev) => ({ ...prev, [key]: value }));
    setGuardCurrentPage(1);
  };

  const clearGuardFilters = () => {
    setGuardFilters({
      search: "",
      region: "all",
      governorate: "all",
      gender: "all",
      insurance: "all",
      status: "all",
    });
    setLocalGuardSearch("");
    setGuardCurrentPage(1);
  };

  // معالجات الفلاتر للمدارس
  const handleSchoolFilterChange = (key: string, value: string) => {
    setSchoolFilters((prev) => ({ ...prev, [key]: value }));
    setSchoolCurrentPage(1);
  };

  const clearSchoolFilters = () => {
    setSchoolFilters({
      search: "",
      region: "all",
      status: "all",
    });
    setLocalSchoolSearch("");
    setSchoolCurrentPage(1);
  };

  // معالجات الحراس
  const handleViewGuard = (guard: Guard) => {
    setSelectedGuard(guard);
    setShowGuardDetails(true);
  };

  const handleEditGuard = (guard: Guard) => {
    setSelectedGuard(guard);
    setShowGuardForm(true);
  };

  const handleDeleteGuard = async (id: string) => {
    const guard = guards.find(g => g.id === id);
    const guardName = guard?.guard_name || 'الحارس';
    if (!confirm(`هل أنت متأكد من حذف الحارس "${guardName}"؟`)) return;

    try {
      await GuardService.deleteGuard(id);
      await OperationService.logOperation('حذف حارس', `تم حذف الحارس: ${guardName}`);
      await loadData();
      setConfirmationText(`تم حذف الحارس ${guardName} بنجاح`);
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      setConfirmationText(err instanceof Error ? err.message : 'خطأ في حذف الحارس');
      setConfirmationType('error');
      setShowConfirmation(true);
    }
  };

  const handleGuardSubmit = async (data: any) => {
    try {
      if (selectedGuard) {
        await GuardService.updateGuard(selectedGuard.id, data);
        setConfirmationText(`تم تعديل بيانات الحارس ${data.guard_name} بنجاح`);
      } else {
        await GuardService.createGuard(data);
        setConfirmationText(`تم إضافة الحارس ${data.guard_name} بنجاح`);
      }
      setShowGuardForm(false);
      setSelectedGuard(null);
      await loadData();
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      throw err;
    }
  };

  // معالجات المدارس
  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setShowSchoolForm(true);
  };

  const handleDeleteSchool = async (id: string) => {
    const school = schools.find(s => s.id === id);
    const schoolName = school?.school_name || 'المدرسة';
    if (!confirm(`هل أنت متأكد من حذف المدرسة "${schoolName}"؟`)) return;

    try {
      await SchoolService.deleteSchool(id);
      await loadData();
      setConfirmationText(`تم حذف المدرسة ${schoolName} بنجاح`);
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      setConfirmationText(err instanceof Error ? err.message : 'خطأ في حذف المدرسة');
      setConfirmationType('error');
      setShowConfirmation(true);
    }
  };

  const handleSchoolSubmit = async (data: any) => {
    try {
      if (selectedSchool) {
        await SchoolService.updateSchool(selectedSchool.id, data);
        setConfirmationText(`تم تعديل بيانات المدرسة ${data.school_name} بنجاح`);
      } else {
        await SchoolService.createSchool(data);
        setConfirmationText(`تم إضافة المدرسة ${data.school_name} بنجاح`);
      }
      setShowSchoolForm(false);
      setSelectedSchool(null);
      await loadData();
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      throw err;
    }
  };
  const fetchSchoolGuards = async (schoolId: string) => {
    try {
      setGuardsLoading(true);
      setGuardsList([]);

      const result = await GuardService.getFilteredGuards(
        { schoolId },
        1,
        1000
      );

      setGuardsList(result.guards);
    } catch (err) {
      console.error('خطأ في جلب حراس المدرسة:', err);
      setGuardsList([]);
    } finally {
      setGuardsLoading(false);
    }
  };
  // تصدير البيانات
  const handleExport = async (format: "excel" | "pdf") => {
    try {
      setExporting(true);

      if (activeTab === "guards") {
        // جلب جميع الحراس المفلترين للتصدير (جميع الصفحات)
        const allGuards = await GuardService.getFilteredGuards(
          guardFilters,
          1,
          totalGuardsCount || 10000, // استخدام عدد كبير لضمان جلب جميع البيانات
        );

        if (format === "excel") {
          await ExportService.exportToExcel(
            allGuards.guards,
            "بيانات_الحراس_مفلترة",
          );
        } else {
          await ExportService.exportToPDF(
            allGuards.guards,
            "بيانات الحراس المفلترة",
          );
        }
      } else {
        // جلب جميع المدارس المفلترة للتصدير (جميع الصفحات)
        const allSchools = await SchoolService.getFilteredSchools(
          schoolFilters,
          1,
          totalSchoolsCount || 10000, // استخدام عدد كبير لضمان جلب جميع البيانات
        );

        if (format === "excel") {
          // استخدام دالة تصدير مخصصة للمدارس
          await ExportService.exportSchoolsToExcel(
            allSchools.schools,
            "بيانات_المدارس_مفلترة",
          );
        } else {
          await ExportService.exportSchoolsToPDF(
            allSchools.schools,
            "بيانات المدارس المفلترة",
          );
        }
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : "خطأ في التصدير");
    } finally {
      setExporting(false);
    }
  };

  const getUniqueGovernorates = () => {
    // هذه دالة مساعدة للحصول على المحافظات حسب المنطقة
    // يمكن تحسينها لاحقًا لجلب البيانات من الخادم
    const governoratesByRegion: { [key: string]: string[] } = {
      عسير: ["أبها", "خميس مشيط", "النماص", "بيشة"],
      جيزان: ["جيزان", "صبيا", "أبو عريش"],
      الباحة: ["الباحة", "بلجرشي", "المندق"],
      نجران: ["نجران", "شرورة"],
    };

    if (guardFilters.region === "all") return [];
    return governoratesByRegion[guardFilters.region] || [];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">إدارة البيانات</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
            <button
              onClick={() => { onDataChange(); onClose(); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("guards")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "guards"
                ? "border-b-2 border-moe-500 text-moe-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="w-5 h-5" />
            الحراس ({totalGuardsCount})
          </button>
          <button
            onClick={() => setActiveTab("schools")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "schools"
                ? "border-b-2 border-moe-500 text-moe-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 className="w-5 h-5" />
            المدارس ({totalSchoolsCount})
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Guards Tab */}
          {activeTab === "guards" && (
            <div className="h-full flex flex-col">
              {/* Guards Filters */}
              <div className="p-4 border-b bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البحث
                    </label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={localGuardSearch}
                        onChange={(e) => setLocalGuardSearch(e.target.value)}
                        onKeyDown={handleGuardSearchKeyDown}
                        placeholder="ابحث بالاسم، السجل المدني..."
                        className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <button
                      onClick={handleGuardSearchSubmit}
                      className="mt-1 px-3 py-1 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors text-xs"
                    >
                      بحث
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المنطقة
                    </label>
                    <select
                      value={guardFilters.region}
                      onChange={(e) => {
                        handleGuardFilterChange("region", e.target.value);
                        if (e.target.value === "all") {
                          handleGuardFilterChange("governorate", "all");
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                    >
                      <option value="all">جميع المناطق</option>
                      <option value="عسير">عسير</option>
                      <option value="جيزان">جيزان</option>
                      <option value="الباحة">الباحة</option>
                      <option value="نجران">نجران</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المحافظة
                    </label>
                    <select
                      value={guardFilters.governorate}
                      onChange={(e) =>
                        handleGuardFilterChange("governorate", e.target.value)
                      }
                      disabled={guardFilters.region === "all"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm disabled:bg-gray-100"
                    >
                      <option value="all">جميع المحافظات</option>
                      {getUniqueGovernorates().map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الجنس
                    </label>
                    <select
                      value={guardFilters.gender}
                      onChange={(e) =>
                        handleGuardFilterChange("gender", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                    >
                      <option value="all">الكل</option>
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      التأمين
                    </label>
                    <select
                      value={guardFilters.insurance}
                      onChange={(e) =>
                        handleGuardFilterChange("insurance", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                    >
                      <option value="all">الكل</option>
                      <option value="نعم">نعم</option>
                      <option value="لا">لا</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <select
                      value={guardFilters.status}
                      onChange={(e) =>
                        handleGuardFilterChange("status", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="على رأس العمل">على رأس العمل</option>
                      <option value="منقطع">منقطع</option>
                      <option value="مبعد عن المدارس">مبعد</option>
                      <option value="إجازة">إجازة</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={clearGuardFilters}
                    className="text-sm text-moe-600 hover:text-moe-800"
                  >
                    مسح الفلاتر
                  </button>

                  <div className="flex gap-2">
                    {(AuthService.hasSpecificPermission("guards.create") ||
                      AuthService.hasSpecificPermission("admin")) && (
                      <button
                        onClick={() => {
                          setSelectedGuard(null);
                          setShowGuardForm(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة حارس
                      </button>
                    )}

                    {(AuthService.hasSpecificPermission("guards.export") ||
                      AuthService.hasSpecificPermission("admin")) && (
                      <button
                        onClick={() => handleExport("excel")}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-1 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        تصدير
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Guards Table */}
              <div className="flex-1 overflow-hidden border rounded-lg">
                <div
                  className="h-full overflow-auto"
                  style={{ maxHeight: "400px" }}
                >
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          اسم الحارس
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          المدرسة
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          المنطقة
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          الجنس
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          التأمين
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          الحالة
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            جاري التحميل...
                          </td>
                        </tr>
                      ) : guards.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            لا توجد نتائج
                          </td>
                        </tr>
                      ) : (
                        guards.map((guard) => (
                          <tr key={guard.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {guard.guard_name}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span
                                className={
                                  guard.school?.school_name
                                    ? "text-gray-800 font-medium"
                                    : "text-red-500 italic text-sm"
                                }
                              >
                                {guard.school?.school_name || "غير مسند"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span
                                className={
                                  guard.school?.region
                                    ? "text-gray-800 font-medium"
                                    : "text-gray-400 text-sm"
                                }
                              >
                                {guard.school?.region || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  guard.gender === "ذكر"
                                    ? "bg-moe-100 text-moe-800"
                                    : guard.gender === "أنثى"
                                      ? "bg-pink-100 text-pink-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {guard.gender || "غير محدد"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  guard.insurance === "نعم"
                                    ? "bg-green-100 text-green-800"
                                    : guard.insurance === "لا"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {guard.insurance || "غير محدد"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  guard.status === "على رأس العمل"
                                    ? "bg-green-100 text-green-800"
                                    : guard.status === "منقطع"
                                      ? "bg-red-100 text-red-800"
                                      : guard.status === "إجازة"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {guard.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewGuard(guard)}
                                  className="p-1 text-moe-600 hover:bg-moe-50 rounded transition-colors"
                                  title="عرض التفاصيل"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {(AuthService.hasSpecificPermission(
                                  "guards.edit",
                                ) ||
                                  AuthService.hasSpecificPermission(
                                    "admin",
                                  )) && (
                                  <button
                                    onClick={() => handleEditGuard(guard)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="تعديل"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}

                                {(AuthService.hasSpecificPermission(
                                  "guards.delete",
                                ) ||
                                  AuthService.hasSpecificPermission(
                                    "admin",
                                  )) && (
                                  <button
                                    onClick={() => handleDeleteGuard(guard.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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

              {/* Guards Pagination */}
              <div className="border-t">
                <Pagination
                  currentPage={guardCurrentPage}
                  totalItems={totalGuardsCount}
                  itemsPerPage={guardItemsPerPage}
                  onPageChange={setGuardCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setGuardItemsPerPage(newItemsPerPage);
                    setGuardCurrentPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {/* Schools Tab */}
          {activeTab === "schools" && (
            <div className="h-full flex flex-col">
              {/* Schools Filters */}
              <div className="p-4 border-b bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البحث
                    </label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={localSchoolSearch}
                        onChange={(e) => setLocalSchoolSearch(e.target.value)}
                        onKeyDown={handleSchoolSearchKeyDown}
                        placeholder="ابحث باسم المدرسة، المحافظة..."
                        className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <button
                      onClick={handleSchoolSearchSubmit}
                      className="mt-1 px-3 py-1 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors text-xs"
                    >
                      بحث
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المنطقة
                    </label>
                    <select
                      value={schoolFilters.region}
                      onChange={(e) =>
                        handleSchoolFilterChange("region", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                    >
                      <option value="all">جميع المناطق</option>
                      <option value="عسير">عسير</option>
                      <option value="جيزان">جيزان</option>
                      <option value="الباحة">الباحة</option>
                      <option value="نجران">نجران</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <select
                      value={schoolFilters.status}
                      onChange={(e) =>
                        handleSchoolFilterChange("status", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="نشط">نشط</option>
                      <option value="غير نشط">غير نشط</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={clearSchoolFilters}
                    className="text-sm text-moe-600 hover:text-moe-800"
                  >
                    مسح الفلاتر
                  </button>

                  <div className="flex gap-2">
                    {(AuthService.hasSpecificPermission("schools.create") ||
                      AuthService.hasSpecificPermission("admin")) && (
                      <button
                        onClick={() => {
                          setSelectedSchool(null);
                          setShowSchoolForm(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة مدرسة
                      </button>
                    )}

                    <button
                      onClick={() => handleExport("excel")}
                      disabled={exporting}
                      className="flex items-center gap-2 px-3 py-1 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      تصدير
                    </button>
                  </div>
                </div>
              </div>

              {/* Schools Table */}
              <div className="flex-1 overflow-hidden border rounded-lg">
                <div
                  className="h-full overflow-auto"
                  style={{ maxHeight: "400px" }}
                >
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          اسم المدرسة
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          المنطقة
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          المحافظة
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          المدير/ة
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">
                          {" "}
                          عدد الحراس
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          الحالة
                        </th>

                        <th className="px-4 py-3 text-right font-medium text-gray-700">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            جاري التحميل...
                          </td>
                        </tr>
                      ) : schools.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            لا توجد نتائج
                          </td>
                        </tr>
                      ) : (
                        schools.map((school) => (
                          <tr key={school.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {school.school_name}
                            </td>

                            <td className="px-4 py-3 text-gray-700">
                              {school.region}
                            </td>

                            <td className="px-4 py-3 text-gray-700">
                              {school.governorate}
                            </td>

                            <td className="px-4 py-3 text-gray-700">
                              {school.principal_name || "-"}
                            </td>

                            {/* 👇 عدد الحراس */}
                            <td className="px-4 py-3 text-center font-bold text-moe-600">
                              {school.guards_count}
                            </td>

                            {/* 👇 الحالة */}
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  school.status === "نشط"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {school.status}
                              </span>
                            </td>

                            {/* 👇 الإجراءات */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {/* 👁️ عرض الحراس */}
                                <button
                                  onClick={() => {
                                    setSelectedSchool(school);

                                    // 🔥 مهم جداً: تصفير البيانات القديمة
                                    setGuardsList([]);

                                    // 🔥 جلب جديد
                                    fetchSchoolGuards(school.id);

                                    // فتح المودال
                                    setShowSchoolGuardsModal(true);
                                  }}
                                  className="p-1 text-moe-600 hover:bg-moe-50 rounded transition-colors"
                                  title="عرض الحراس"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {(AuthService.hasSpecificPermission(
                                  "schools.edit",
                                ) ||
                                  AuthService.hasSpecificPermission(
                                    "admin",
                                  )) && (
                                  <button
                                    onClick={() => handleEditSchool(school)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="تعديل"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}

                                {(AuthService.hasSpecificPermission(
                                  "schools.delete",
                                ) ||
                                  AuthService.hasSpecificPermission(
                                    "admin",
                                  )) && (
                                  <button
                                    onClick={() =>
                                      handleDeleteSchool(school.id)
                                    }
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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

              {/* Schools Pagination */}
              <div className="border-t">
                <Pagination
                  currentPage={schoolCurrentPage}
                  totalItems={totalSchoolsCount}
                  itemsPerPage={schoolItemsPerPage}
                  onPageChange={setSchoolCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setSchoolItemsPerPage(newItemsPerPage);
                    setSchoolCurrentPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Modals */}
        {showGuardForm && (
          <GuardForm
            guard={selectedGuard}
            schools={[]} // سيتم جلبها داخل المكون
            onSubmit={handleGuardSubmit}
            onCancel={() => {
              setShowGuardForm(false);
              setSelectedGuard(null);
            }}
          />
        )}

        {showSchoolForm && (
          <AddSchoolModal
            school={selectedSchool}
            onSubmit={handleSchoolSubmit}
            onClose={() => {
              setShowSchoolForm(false);
              setSelectedSchool(null);
            }}
          />
        )}

        {showGuardDetails && selectedGuard && (
          <GuardDetailsModal
            guard={selectedGuard}
            onClose={() => {
              setShowGuardDetails(false);
              setSelectedGuard(null);
            }}
            onEdit={() => {
              setShowGuardDetails(false);
              setShowGuardForm(true);
            }}
          />
        )}
        {showConfirmation && (
          <ConfirmationMessage
            message={confirmationText}
            type={confirmationType}
            onClose={() => setShowConfirmation(false)}
          />
        )}

        {showSchoolGuardsModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[600px] max-h-[80vh] rounded-xl shadow-lg p-5 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  {selectedSchool?.school_name}
                </h2>

                <button onClick={() => setShowSchoolGuardsModal(false)}>
                  ✖
                </button>
              </div>

              <div className="mb-3 text-sm text-gray-600">
                عدد الحراس:{" "}
                <span className="font-bold">{guardsList.length}</span>
              </div>

              {guardsList.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  لا يوجد حراس
                </div>
              ) : (
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">الاسم</th>
                      <th className="p-2">الجوال</th>
                      <th className="p-2">الحالة</th>
                    </tr>
                  </thead>

                  <tbody>
                    {guardsList.map((g, i) => (
                      <tr key={i} className="text-center border-t">
                        <td className="p-2">{g.guard_name}</td>
                        <td className="p-2">{g.mobile}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-white text-xs ${
                              g.status === "على رأس العمل"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
