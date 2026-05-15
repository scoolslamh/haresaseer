import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  Download,
  X,
  BarChart2
} from 'lucide-react';
import { ViolationService } from '../services/violationService';
import { Violation, Guard } from '../types';
import { AuthService } from '../services/authService';
import { AddViolationModal } from './AddViolationModal';
import { ExportService } from '../services/exportService';
import { Pagination } from './Pagination';
import { supabase } from '../lib/supabase';
import { GuardViolationsReport } from './GuardViolationsReport';

export const ViolationsPage: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [showGuardReport, setShowGuardReport] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    violationType: 'all',
    guardId: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    complaints: 0,
    warnings: 0,
    violations: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadStats();
    loadGuards();
  }, []);

  useEffect(() => {
    loadViolations();
  }, [filters, currentPage, itemsPerPage]);

  const loadStats = async () => {
    try {
      const s = await ViolationService.getViolationPageStats();
      setStats(s);
    } catch { /* non-blocking */ }
  };

  const loadGuards = async () => {
    try {
      const { data } = await supabase
        .from('guards')
        .select('id, guard_name, civil_id, school_id')
        .order('guard_name');
      setGuards((data || []) as Guard[]);
    } catch { /* non-blocking */ }
  };

  const loadViolations = async () => {
    try {
      setLoading(true);
      setError(null);
      const { violations: data, totalCount: total } =
        await ViolationService.getFilteredViolations(filters, currentPage, itemsPerPage);
      setViolations(data);
      setTotalCount(total);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setCurrentPage(1);
    await Promise.all([loadStats(), loadViolations()]);
  };

  const handleFilterChange = (key: string, value: string) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setFilters({ search: '', violationType: 'all', guardId: 'all', dateFrom: '', dateTo: '' });
  };

  const handleAddViolation = async (violationData: any) => {
    await ViolationService.createViolation(violationData);
    setShowAddModal(false);
    await loadData();
  };

  const handleEditViolation = (violation: Violation) => {
    setSelectedViolation(violation);
    setShowEditModal(true);
  };

  const handleViewViolation = (violation: Violation) => {
    setSelectedViolation(violation);
    setShowDetailsModal(true);
  };

  const handleDeleteViolation = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المخالفة؟')) return;
    
    try {
      await ViolationService.deleteViolation(id);
      await loadData();
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'خطأ في حذف المخالفة');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(true);
      const allFiltered = await ViolationService.getViolationsForExport(filters);
      if (format === 'excel') {
        await ExportService.exportViolationsToExcel(allFiltered, 'سجل_المخالفات');
      } else {
        await ExportService.exportViolationsToPDF(allFiltered, 'سجل المخالفات');
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'خطأ في التصدير');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'شكوى': return 'bg-yellow-100 text-yellow-800';
      case 'إنذار': return 'bg-orange-100 text-orange-800';
      case 'مخالفة': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'شكوى': return '⚠️';
      case 'إنذار': return '🔶';
      case 'مخالفة': return '🔴';
      default: return '📋';
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
          <AlertTriangle className="w-5 h-5 text-red-600" />
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
          <AlertTriangle className="w-8 h-8 text-red-900" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة المخالفات</h1>
            <p className="text-gray-600">عرض وإدارة جميع مخالفات الحراس</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {(AuthService.hasSpecificPermission('violations.create') || AuthService.hasSpecificPermission('admin')) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة مخالفة
            </button>
          )}
          
          <button
            onClick={() => setShowGuardReport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            title="تقرير مخالفات حارس"
          >
            <BarChart2 className="w-4 h-4" />
            تقرير حارس
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-moe-900 text-white'
                : 'bg-white text-moe-900 border border-moe-900 hover:bg-moe-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            الفلاتر
          </button>
          
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.total}</p>
              <p className="text-sm text-gray-600">إجمالي المخالفات</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.complaints}</p>
              <p className="text-sm text-gray-600">شكاوى</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔶</div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.warnings}</p>
              <p className="text-sm text-gray-600">إنذارات</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔴</div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.violations}</p>
              <p className="text-sm text-gray-600">مخالفات</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-moe-600" />
            <div>
              <p className="text-2xl font-bold text-moe-600">{stats.thisMonth}</p>
              <p className="text-sm text-gray-600">هذا الشهر</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">فلاتر البحث</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-moe-600 hover:text-moe-800"
            >
              مسح الفلاتر
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* البحث النصي */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="ابحث في الوصف أو اسم الحارس..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* نوع المخالفة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع المخالفة
              </label>
              <select
                value={filters.violationType}
                onChange={(e) => handleFilterChange('violationType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">جميع الأنواع</option>
                <option value="شكوى">شكوى</option>
                <option value="إنذار">إنذار</option>
                <option value="مخالفة">مخالفة</option>
              </select>
            </div>

            {/* الحارس */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحارس
              </label>
              <select
                value={filters.guardId}
                onChange={(e) => handleFilterChange('guardId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">جميع الحراس</option>
                {guards.map(guard => (
                  <option key={guard.id} value={guard.id}>
                    {guard.guard_name}
                  </option>
                ))}
              </select>
            </div>

            {/* من تاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* إلى تاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      {totalCount > 0 && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
          </button>
        </div>
      )}

      {/* Violations Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-700">النوع</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الحارس</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المدرسة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الوصف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">تاريخ المخالفة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المُسجل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'جاري التحميل...' : 'لا توجد مخالفات'}
                  </td>
                </tr>
              ) : (
                violations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getViolationIcon(violation.violation_type)}</span>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getViolationColor(violation.violation_type)}`}>
                          {violation.violation_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 font-medium">
                          {violation.guard?.guard_name || 'غير محدد'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {violation.guard?.school?.school_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 max-w-xs truncate" title={violation.description}>
                        {violation.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {formatDate(violation.violation_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {violation.created_by || 'غير محدد'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewViolation(violation)}
                          className="p-1 text-moe-600 hover:bg-moe-50 rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {(AuthService.hasSpecificPermission('violations.edit') || AuthService.hasSpecificPermission('admin')) && (
                          <button
                            onClick={() => handleEditViolation(violation)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(AuthService.hasSpecificPermission('violations.delete') || AuthService.hasSpecificPermission('admin')) && (
                          <button
                            onClick={() => handleDeleteViolation(violation.id)}
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
      />

      {/* Results Summary */}
      <div className="text-center text-gray-600">
        إجمالي النتائج: {totalCount} مخالفة
      </div>

      {/* Guard Violations Report */}
      {showGuardReport && (
        <GuardViolationsReport onClose={() => setShowGuardReport(false)} />
      )}

      {/* Add Violation Modal */}
      {showAddModal && (
        <AddViolationModal
          guards={guards}
          onSubmit={handleAddViolation}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Violation Details Modal */}
      {showDetailsModal && selectedViolation && (
        <ViolationDetailsModal
          violation={selectedViolation}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedViolation(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
};

// Violation Details Modal Component
interface ViolationDetailsModalProps {
  violation: Violation;
  onClose: () => void;
  onEdit: () => void;
}

const ViolationDetailsModal: React.FC<ViolationDetailsModalProps> = ({
  violation,
  onClose,
  onEdit
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'شكوى': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'إنذار': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'مخالفة': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'شكوى': return '⚠️';
      case 'إنذار': return '🔶';
      case 'مخالفة': return '🔴';
      default: return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getViolationIcon(violation.violation_type)}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">تفاصيل المخالفة</h2>
              <p className="text-sm text-gray-600">{violation.violation_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(AuthService.hasSpecificPermission('violations.edit') || AuthService.hasSpecificPermission('admin')) && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                تعديل
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* نوع المخالفة */}
          <div className={`p-4 rounded-lg border ${getViolationColor(violation.violation_type)}`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getViolationIcon(violation.violation_type)}</div>
              <div>
                <h3 className="text-lg font-semibold">نوع المخالفة</h3>
                <p className="text-xl font-bold">{violation.violation_type}</p>
              </div>
            </div>
          </div>

          {/* معلومات الحارس */}
          {violation.guard && (
            <div className="bg-moe-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                معلومات الحارس
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">اسم الحارس</label>
                  <p className="text-lg font-semibold text-gray-800">{violation.guard.guard_name}</p>
                </div>
                
                {violation.guard.civil_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">السجل المدني</label>
                    <p className="text-gray-800">{violation.guard.civil_id}</p>
                  </div>
                )}
                
                {violation.guard.school && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">المدرسة</label>
                    <p className="text-gray-800 font-medium">{violation.guard.school.school_name}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">حالة الحارس</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    violation.guard.status === 'على رأس العمل' 
                      ? 'bg-green-100 text-green-800' 
                      : violation.guard.status === 'منقطع'
                      ? 'bg-red-100 text-red-800'
                      : violation.guard.status === 'إجازة'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {violation.guard.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* تفاصيل المخالفة */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تفاصيل المخالفة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ المخالفة</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-800">{formatDate(violation.violation_date)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ التسجيل</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-800">{formatDateTime(violation.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">وصف المخالفة</label>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-gray-800 leading-relaxed">{violation.description}</p>
              </div>
            </div>
          </div>

          {/* معلومات النظام */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات النظام</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <label className="block font-medium mb-1">المُسجل بواسطة</label>
                <p className="text-gray-800">{violation.created_by || 'غير محدد'}</p>
              </div>
              <div>
                <label className="block font-medium mb-1">معرف المخالفة</label>
                <p className="text-gray-800 font-mono text-xs">{violation.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};