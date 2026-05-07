import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ArrowRightLeft,
  UserPlus,
  School,
  FileEdit,
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  UserX,
  Building2,
  Users,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { OperationService } from '../services/operationService';
import { GuardService } from '../services/guardService';
import { SchoolService } from '../services/schoolService';
import { ViolationService } from '../services/violationService';
import { Operation, Guard, School as SchoolType, Violation } from '../types';
import { AuthService } from '../services/authService';
import { TransferGuardModal } from './TransferGuardModal';
import { OperationDetailsModal } from './OperationDetailsModal';
import { ReassignGuardModal } from './ReassignGuardModal';
import { DataManagementModal } from './DataManagementModal';
import { AddViolationModal } from './AddViolationModal';
import { BulkDeleteModal } from './BulkDeleteModal';
import { ExportService } from '../services/exportService';
import { Pagination } from './Pagination';
import { supabase } from '../lib/supabase';
import { ConfirmationMessage } from './ConfirmationMessage';

export const OperationsPage: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<Operation[]>([]);
  const [totalOperationsCount, setTotalOperationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showAddViolationModal, setShowAddViolationModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedOperations, setPaginatedOperations] = useState<Operation[]>([]);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    operationType: 'all',
    dateFrom: '',
    dateTo: '',
    guardId: 'all'
  });

  const [stats, setStats] = useState({
    total: 0,
    transfers: 0,
    reassignments: 0,
    additions: 0,
    modifications: 0,
    deletions: 0,
    violations: 0,
    today: 0
  });

  useEffect(() => {
    loadGuardOptions();
  }, []);

  useEffect(() => {
    if (localSearchTerm === filters.search) return;

    const timeoutId = window.setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: localSearchTerm
      }));
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [localSearchTerm, filters.search]);

  useEffect(() => {
    loadData();
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    setLocalSearchTerm(filters.search);
  }, [filters.search]);

  const loadGuardOptions = async () => {
    try {
      const pageSize = 1000;
      let page = 0;
      let allGuards: Guard[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('guards')
          .select('id, school_id, guard_name, civil_id')
          .order('guard_name')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        const guardsPage = (data || []) as Guard[];
        allGuards = [...allGuards, ...guardsPage];

        if (guardsPage.length < pageSize) break;
        page++;
      }

      setGuards(allGuards);
    } catch (err) {
      console.error('خطأ في تحميل قائمة الحراس:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const operationsResult = await OperationService.getFilteredOperations(
        filters,
        currentPage,
        itemsPerPage
      );
      
      setOperations(operationsResult.operations);
      setFilteredOperations(operationsResult.operations);
      setPaginatedOperations(operationsResult.operations);
      setTotalOperationsCount(operationsResult.totalCount);
      setStats(operationsResult.stats);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...operations];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(op => 
        op.description.toLowerCase().includes(searchTerm) ||
        op.guard?.guard_name?.toLowerCase().includes(searchTerm) ||
        op.school_from?.school_name?.toLowerCase().includes(searchTerm) ||
        op.school_to?.school_name?.toLowerCase().includes(searchTerm) ||
        op.user?.full_name?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.operationType && filters.operationType !== 'all') {
      filtered = filtered.filter(op => op.operation_type === filters.operationType);
    }

    if (filters.guardId && filters.guardId !== 'all') {
      filtered = filtered.filter(op => op.guard_id === filters.guardId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(op => 
        new Date(op.created_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(op => 
        new Date(op.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    setFilteredOperations(filtered);

    const today = new Date().toDateString();
    const newStats = {
      total: filtered.length,
      transfers: filtered.filter(op => op.operation_type === 'نقل').length,
      reassignments: filtered.filter(op => op.operation_type === 'إعادة توجيه').length,
      additions: filtered.filter(op => op.operation_type === 'إضافة حارس' || op.operation_type === 'إضافة مدرسة').length,
      modifications: filtered.filter(op => op.operation_type === 'تعديل بيانات').length,
      deletions: filtered.filter(op => op.operation_type === 'حذف حارس' || op.operation_type === 'حذف مدرسة' || op.operation_type === 'حذف مجموعة').length,
      violations: filtered.filter(op => op.operation_type === 'إضافة مخالفة').length,
      today: filtered.filter(op => 
        new Date(op.created_at).toDateString() === today
      ).length
    };
    setStats(newStats);
  };

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedOperations(filteredOperations.slice(startIndex, endIndex));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      operationType: 'all',
      dateFrom: '',
      dateTo: '',
      guardId: 'all'
    });
    setLocalSearchTerm('');
    setCurrentPage(1);
  };

  const handleViewOperation = (operation: Operation) => {
    setSelectedOperation(operation);
    setShowOperationDetails(true);
  };
const handleTransferSubmit = async (
  guardId: string,
  newSchoolId: string,
  description: string
) => {
  if (!confirm('هل أنت متأكد من نقل هذا الحارس؟')) return;

  try {
    // 🔥 1. جلب المدرسة القديمة من قاعدة البيانات (الحل الحقيقي)
    const { data: guard, error: guardError } = await supabase
      .from('guards')
      .select('school_id')
      .eq('id', guardId)
      .single();

    if (guardError) throw guardError;

    const oldSchoolId = guard?.school_id;

    // 🔥 2. تنفيذ النقل
    await GuardService.transferGuard(guardId, newSchoolId, description);

    // 🔥 3. تسجيل العملية (بعد ما أخذنا القيمة الصحيحة)
    await OperationService.logOperation(
      'نقل',
      description,
      guardId,
      oldSchoolId,     // ✅ الآن صحيح 100%
      newSchoolId
    );

    setShowTransferModal(false);
    setSelectedGuard(null);
    await loadData();
    setConfirmationText(`تم نقل الحارس بنجاح`);
    setConfirmationType('success');
    setShowConfirmation(true);

  } catch (err: any) {
    throw err;
  }
};

  const handleReassignSubmit = async (guardId: string, newSchoolId: string, description: string) => {
    if (!confirm('هل أنت متأكد من إعادة توجيه هذا الحارس؟')) return;
    
    try {
      await GuardService.transferGuard(guardId, newSchoolId, description);
      
      await OperationService.logOperation(
        'إعادة توجيه',
        description,
        guardId,
        undefined,
        newSchoolId
      );
      
      setShowReassignModal(false);
      setSelectedGuard(null);
      await loadData();
      setConfirmationText('تم إعادة توجيه الحارس بنجاح');
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      throw err;
    }
  };

  const handleAddViolationSubmit = async (violationData: any) => {
    if (!confirm('هل أنت متأكد من إضافة هذه المخالفة؟')) return;
    
    try {
      await ViolationService.createViolation(violationData);
      
      const guard = guards.find(g => g.id === violationData.guard_id);
      await OperationService.logOperation(
        'إضافة مخالفة',
        `تم إضافة ${violationData.violation_type} للحارس ${guard?.guard_name}: ${violationData.description}`,
        violationData.guard_id
      );
      
      setShowAddViolationModal(false);
      await loadData();
      setConfirmationText('تم إضافة المخالفة بنجاح');
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteGuard = async (guard: Guard) => {
    if (!confirm(`هل أنت متأكد من حذف الحارس "${guard.guard_name}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;

    try {
      await GuardService.deleteGuard(guard.id);

      await OperationService.logOperation(
        'حذف حارس',
        `تم حذف الحارس: ${guard.guard_name}`,
        undefined
      );

      await loadData();
      setConfirmationText(`تم حذف الحارس ${guard.guard_name} بنجاح`);
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      setConfirmationText(err instanceof Error ? err.message : 'خطأ في حذف الحارس');
      setConfirmationType('error');
      setShowConfirmation(true);
    }
  };

  const handleDeleteSchool = async (school: SchoolType) => {
    if (!confirm(`هل أنت متأكد من حذف المدرسة "${school.school_name}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;

    try {
      await SchoolService.deleteSchool(school.id);

      await OperationService.logOperation(
        'حذف مدرسة',
        `تم حذف المدرسة: ${school.school_name}`,
        undefined,
        undefined
      );

      await loadData();
      setConfirmationText(`تم حذف المدرسة ${school.school_name} بنجاح`);
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      setConfirmationText(err instanceof Error ? err.message : 'خطأ في حذف المدرسة');
      setConfirmationType('error');
      setShowConfirmation(true);
    }
  };

  const handleBulkDeleteSubmit = async (type: string, ids: string[]) => {
    if (!confirm(`هل أنت متأكد من حذف ${ids.length} عنصر؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;

    try {
      if (type === 'guards') {
        await Promise.all(ids.map(id => GuardService.deleteGuard(id)));
      } else if (type === 'schools') {
        await Promise.all(ids.map(id => SchoolService.deleteSchool(id)));
      }

      await OperationService.logOperation(
        'حذف مجموعة',
        `تم حذف ${ids.length} ${type === 'guards' ? 'حارس' : 'مدرسة'} بشكل جماعي`
      );

      setShowBulkDeleteModal(false);
      await loadData();
      setConfirmationText(`تم حذف ${ids.length} ${type === 'guards' ? 'حارس' : 'مدرسة'} بنجاح`);
      setConfirmationType('success');
      setShowConfirmation(true);
    } catch (err: any) {
      throw err;
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(true);
      const operationsToExport = await OperationService.getOperationsForExport(filters);
      
      if (format === 'excel') {
        await ExportService.exportOperationsToExcel(operationsToExport, 'سجل_العمليات');
      } else {
        await ExportService.exportOperationsToPDF(operationsToExport, 'سجل العمليات');
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'خطأ في التصدير');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'نقل': return <ArrowRightLeft className="w-4 h-4" />;
      case 'إعادة توجيه': return <RotateCcw className="w-4 h-4" />;
      case 'إضافة حارس': return <UserPlus className="w-4 h-4" />;
      case 'إضافة مدرسة': return <Building2 className="w-4 h-4" />;
      case 'تعديل بيانات': return <FileEdit className="w-4 h-4" />;
      case 'حذف حارس': return <UserX className="w-4 h-4" />;
      case 'حذف مدرسة': return <Building className="w-4 h-4" />;
      case 'حذف مجموعة': return <Users className="w-4 h-4" />;
      case 'إضافة مخالفة': return <AlertTriangle className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'نقل': return 'bg-moe-100 text-moe-800';
      case 'إعادة توجيه': return 'bg-purple-100 text-purple-800';
      case 'إضافة حارس': return 'bg-green-100 text-green-800';
      case 'إضافة مدرسة': return 'bg-emerald-100 text-emerald-800';
      case 'تعديل بيانات': return 'bg-orange-100 text-orange-800';
      case 'حذف حارس': return 'bg-red-100 text-red-800';
      case 'حذف مدرسة': return 'bg-pink-100 text-pink-800';
      case 'حذف مجموعة': return 'bg-gray-100 text-gray-800';
      case 'إضافة مخالفة': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unassignedGuards = guards.filter(g => !g.school_id);

  const canAccessOperations =
    AuthService.hasPermission('admin') ||
    AuthService.hasSpecificPermission('operations.view') ||
    AuthService.hasSpecificPermission('operations.transfer') ||
    AuthService.hasSpecificPermission('operations.reassign') ||
    AuthService.hasSpecificPermission('operations.bulk_delete');

  // ---- حالات التحميل والخطأ ----
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

  // ---- الـ return الرئيسي الذي يلف كل المحتوى ----
  return (
    <div className="space-y-4 p-4">

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap w-full lg:w-auto justify-end">
        {canAccessOperations && (
          <>
            {(AuthService.hasPermission('admin') || AuthService.hasSpecificPermission('operations.view')) && (
              <button
                onClick={() => setShowDataManagement(true)}
                className="flex items-center gap-2 px-4 py-2 bg-moe-700 text-white rounded-xl transition-all text-sm shadow-md hover:shadow-lg hover:bg-moe-800"
              >
                <Users className="w-4 h-4" />
                إدارة البيانات
              </button>
            )}

            {(AuthService.hasPermission('admin') || AuthService.hasSpecificPermission('operations.transfer')) && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-moe-700 text-white rounded-xl hover:bg-moe-800 transition-all text-sm shadow-md hover:shadow-lg"
              >
                <ArrowRightLeft className="w-4 h-4" />
                نقل حارس
              </button>
            )}

            {(AuthService.hasPermission('admin') || AuthService.hasSpecificPermission('operations.reassign')) && (
              <button
                onClick={() => setShowReassignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-moe-700 text-white rounded-xl transition-all text-sm shadow-md hover:shadow-lg hover:bg-moe-800"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة توجيه
              </button>
            )}

            {(AuthService.hasPermission('admin') || AuthService.hasSpecificPermission('operations.bulk_delete')) && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl transition-all text-sm shadow-md hover:shadow-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                حذف مجموعة
              </button>
            )}
          </>
        )}

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3 overflow-x-auto">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-moe-600" />
            <div>
              <p className="text-lg font-bold text-moe-600">{stats.total}</p>
              <p className="text-xs text-gray-600">إجمالي العمليات</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-lg font-bold text-purple-600">{stats.transfers}</p>
              <p className="text-xs text-gray-600">عمليات النقل</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-moe-800" />
            <div>
              <p className="text-lg font-bold text-moe-800">{stats.reassignments}</p>
              <p className="text-xs text-gray-600">إعادة التوجيه</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-lg font-bold text-green-600">{stats.additions}</p>
              <p className="text-xs text-gray-600">الإضافات</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-lg font-bold text-orange-600">{stats.modifications}</p>
              <p className="text-xs text-gray-600">التعديلات</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-lg font-bold text-red-600">{stats.deletions}</p>
              <p className="text-xs text-gray-600">الحذف</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="text-lg font-bold text-yellow-600">{stats.violations}</p>
              <p className="text-xs text-gray-600">المخالفات</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-moe-800" />
            <div>
              <p className="text-lg font-bold text-moe-800">{stats.today}</p>
              <p className="text-xs text-gray-600">عمليات اليوم</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">فلاتر البحث</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-moe-600 hover:text-moe-800"
          >
            مسح الفلاتر
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 min-w-max lg:min-w-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                placeholder="ابحث في الوصف، الاسم..."
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
            <select
              value={filters.operationType}
              onChange={(e) => handleFilterChange('operationType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
            >
              <option value="all">جميع العمليات</option>
              <option value="نقل">نقل</option>
              <option value="إعادة توجيه">إعادة توجيه</option>
              <option value="إضافة حارس">إضافة حارس</option>
              <option value="إضافة مدرسة">إضافة مدرسة</option>
              <option value="تعديل بيانات">تعديل بيانات</option>
              <option value="حذف حارس">حذف حارس</option>
              <option value="حذف مدرسة">حذف مدرسة</option>
              <option value="حذف مجموعة">حذف مجموعة</option>
              <option value="إضافة مخالفة">إضافة مخالفة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحارس</label>
            <select
              value={filters.guardId}
              onChange={(e) => handleFilterChange('guardId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
            >
              <option value="all">جميع الحراس</option>
              {guards.map(guard => (
                <option key={guard.id} value={guard.id}>
                  {guard.guard_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      {(AuthService.hasSpecificPermission('operations.export') || AuthService.hasPermission('admin')) && (
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting || totalOperationsCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-moe-700 text-white rounded-xl transition-all text-sm shadow-md hover:shadow-lg hover:bg-moe-800"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </button>

          
        </div>
      )}

      {/* Operations Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-700">نوع العملية</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الوصف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الحارس</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">من مدرسة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">إلى مدرسة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المنفذ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOperations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'جاري التحميل...' : filteredOperations.length === 0 ? 'لا توجد عمليات' : 'لا توجد عناصر في هذه الصفحة'}
                  </td>
                </tr>
              ) : (
                paginatedOperations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getOperationColor(operation.operation_type)}`}>
                          {getOperationIcon(operation.operation_type)}
                          {operation.operation_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 max-w-xs truncate" title={operation.description}>
                        {operation.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {operation.guard ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{operation.guard.guard_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {operation.school_from ? (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 max-w-xs truncate" title={operation.school_from.school_name}>
                            {operation.school_from.school_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {operation.school_to ? (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 max-w-xs truncate" title={operation.school_to.school_name}>
                            {operation.school_to.school_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">
                        {operation.user?.full_name || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 text-xs">
                          {formatDate(operation.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewOperation(operation)}
                        className="p-1 text-moe-600 hover:bg-moe-50 rounded transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalOperationsCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Results Summary */}
      <div className="text-center text-gray-600">
        عرض {operations.length} من أصل {totalOperationsCount} عملية
      </div>

      {/* Modals */}
      {showTransferModal && (
        <TransferGuardModal
          guard={selectedGuard}
          guards={guards.filter(g => g.school_id)}
          schools={schools}
          onSubmit={handleTransferSubmit}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedGuard(null);
          }}
        />
      )}

      {showReassignModal && (
        <ReassignGuardModal
          guards={unassignedGuards}
          schools={schools}
          onSubmit={handleReassignSubmit}
          onClose={() => setShowReassignModal(false)}
        />
      )}

      {showDataManagement && (
        <DataManagementModal
          onClose={() => setShowDataManagement(false)}
          onDataChange={loadData}
        />
      )}

      {showAddViolationModal && (
        <AddViolationModal
          guards={guards}
          onSubmit={handleAddViolationSubmit}
          onClose={() => setShowAddViolationModal(false)}
        />
      )}

      {showBulkDeleteModal && (
        <BulkDeleteModal
          guards={guards}
          schools={schools}
          onSubmit={handleBulkDeleteSubmit}
          onClose={() => setShowBulkDeleteModal(false)}
          onDeleteGuard={handleDeleteGuard}
          onDeleteSchool={handleDeleteSchool}
        />
      )}

      {showOperationDetails && selectedOperation && (
        <OperationDetailsModal
          operation={selectedOperation}
          onClose={() => {
            setShowOperationDetails(false);
            setSelectedOperation(null);
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

    </div>
  );
};
