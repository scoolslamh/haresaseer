import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  FileText,
  Users,
  School,
  MapPin,
  Phone,
  User,
  Shield,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { GuardService } from '../services/guardService';
import { SchoolService } from '../services/schoolService';
import { Guard, School as SchoolType, GuardFilters } from '../types';
import { AuthService } from '../services/authService';
import { GuardForm } from './GuardForm';
import { GuardDetailsModal } from './GuardDetailsModal';
import { ExportService } from '../services/exportService';
import { Pagination } from './Pagination';
import { ConfirmationMessage } from './ConfirmationMessage';
import { OperationService } from '../services/operationService';

export const InquiryPage: React.FC = () => {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [filteredGuards, setFilteredGuards] = useState<Guard[]>([]);
  const [paginatedGuards, setPaginatedGuards] = useState<Guard[]>([]);
  const [totalGuards, setTotalGuards] = useState(0);
  const [overallStats, setOverallStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    insured: 0,
    uninsured: 0,
    active: 0
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showGuardForm, setShowGuardForm] = useState(false);
  const [showGuardDetails, setShowGuardDetails] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const [filters, setFilters] = useState<GuardFilters>({
    search: '',
    region: 'all',
    governorate: 'all',
    gender: 'all',
    insurance: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setLocalSearchTerm(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    loadData();
  }, [filters, currentPage, itemsPerPage]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [schoolsData, guardsResult, statsData] = await Promise.all([
        SchoolService.getAllSchools(),
        GuardService.getFilteredGuards(filters, currentPage, itemsPerPage),
        GuardService.getGuardsStats()
      ]);

      setSchools(schoolsData);
      setFilteredGuards(guardsResult.guards);
      setTotalGuards(guardsResult.totalCount);
      setPaginatedGuards(guardsResult.guards);
      setOverallStats(statsData);
    } catch (err: any) {
      setConfirmationText(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
      setConfirmationType('error');
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage: number) => { setItemsPerPage(newItemsPerPage); setCurrentPage(1); };

  const handleFilterChange = (key: keyof GuardFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    handleFilterChange('search', localSearchTerm);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: 'all',
      governorate: 'all',
      gender: 'all',
      insurance: 'all',
      status: 'all'
    }); 
    setLocalSearchTerm('');
  };

  const handleViewGuard = (guard: Guard) => {
    setSelectedGuard(guard);
    setShowGuardDetails(true);
  };

  const handleEditGuard = (guard: Guard) => {
    setSelectedGuard(guard);
    setShowGuardForm(true);
  };

  const handleDeleteGuard = async (id: string, guardName: string) => {
    if (!AuthService.canDelete()) {
      alert('ليس لديك صلاحية لحذف البيانات');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف الحارس "${guardName}"؟`)) {
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

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(true);
      
      const guardsToExport = filteredGuards;
      
      if (format === 'excel') {
        await ExportService.exportToExcel(guardsToExport, 'بيانات_الحراس');
      } else {
        await ExportService.exportToPDF(guardsToExport, 'بيانات الحراس');
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'خطأ في التصدير');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getUniqueGovernorates = () => {
    if (filters.region === 'all') return [];
    return [...new Set(
      schools
        .filter(school => school.region === filters.region)
        .map(school => school.governorate)
    )].sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moe-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="w-8 h-8 text-moe-900" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الاستعلام عن الحراس</h1>
            <p className="text-gray-600">البحث والتصفية وإدارة بيانات الحراس</p>
          </div>
        </div>
        
        <div className="flex gap-3">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-moe-600" />
            <div>
              <p className="text-2xl font-bold text-moe-600">{overallStats.total}</p>
              <p className="text-sm text-gray-600">إجمالي الحراس</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{overallStats.male}</p>
              <p className="text-sm text-gray-600">ذكور</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-pink-600" />
            <div>
              <p className="text-2xl font-bold text-pink-600">{overallStats.female}</p>
              <p className="text-sm text-gray-600">إناث</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{overallStats.insured}</p>
              <p className="text-sm text-gray-600">يصرف بدل</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{overallStats.uninsured}</p>
              <p className="text-sm text-gray-600">غير يصرف بدل</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-moe-800" />
            <div>
              <p className="text-2xl font-bold text-moe-800">{overallStats.active}</p>
              <p className="text-sm text-gray-600">حراس على رأس العمل</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* البحث النصي */}
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="ابحث بالاسم، السجل المدني، الجوال..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearchSubmit}
                className="mt-2 px-4 py-2 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors text-sm"
              >
                بحث
              </button>
            </div>

            {/* المنطقة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المنطقة
              </label>
              <select
                value={filters.region}
                onChange={(e) => {
                  handleFilterChange('region', e.target.value);
                  // إعادة تعيين المحافظة عند تغيير المنطقة
                  if (e.target.value === 'all') {
                    handleFilterChange('governorate', 'all');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="all">جميع المناطق</option>
                <option value="عسير">عسير</option>
                <option value="جيزان">جيزان</option>
                <option value="الباحة">الباحة</option>
                <option value="نجران">نجران</option>
              </select>
            </div>

            {/* المحافظة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المحافظة
              </label>
              <select
                value={filters.governorate}
                onChange={(e) => handleFilterChange('governorate', e.target.value)}
                disabled={filters.region === 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="all">جميع المحافظات</option>
                {getUniqueGovernorates().map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            {/* الجنس */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الجنس
              </label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="all">الكل</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>

            {/* البدل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البدل
              </label>
              <select
                value={filters.insurance}
                onChange={(e) => handleFilterChange('insurance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="all">الكل</option>
                <option value="نعم">نعم</option>
                <option value="لا">لا</option>
              </select>
            </div>

            {/* الحالة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="على رأس العمل">على رأس العمل</option>
                <option value="إجازة أمومة/رعاية مولود">إجازة أمومة/رعاية مولود</option>
                <option value="إجازة مرضية">إجازة مرضية</option>
                <option value="إيقاف الراتب مؤقتاً">إيقاف الراتب مؤقتاً</option>
                <option value="مجاز استثنائياً">مجاز استثنائياً</option>
                <option value="مكفوف اليد">مكفوف اليد</option>
                <option value="مكلف داخلي">مكلف داخلي</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      {(AuthService.hasSpecificPermission('guards.export') || AuthService.hasSpecificPermission('admin')) && filteredGuards.length > 0 && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4" />
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

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-700">اسم الحارس</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المدرسة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المنطقة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المحافظة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الجنس</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">البدل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الجوال</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedGuards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'جاري التحميل...' : 'لا توجد نتائج'}
                  </td>
                </tr>
              ) : (
                paginatedGuards.map((guard) => (
                  <tr key={guard.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-moe-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-moe-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{guard.guard_name}</p>
                          {guard.civil_id && (
                            <p className="text-xs text-gray-500">السجل: {guard.civil_id}</p>
                          )}
                          {guard.job_title && (
                            <p className="text-xs text-gray-500">المسمى: {guard.job_title}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {guard.school?.school_name || 'غير محدد'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {guard.school?.region || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {guard.school?.governorate || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        guard.gender === 'ذكر' 
                          ? 'bg-moe-100 text-moe-800' 
                          : guard.gender === 'أنثى'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {guard.gender || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        guard.insurance === 'يصرف بدل'
                          ? 'bg-green-100 text-green-800'
                          : guard.insurance === 'لا يصرف'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {guard.insurance || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {guard.mobile ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700" dir="ltr">{guard.mobile}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        guard.status === 'على رأس العمل'
                          ? 'bg-green-100 text-green-800'
                          : guard.status === 'مكلف داخلي'
                          ? 'bg-blue-100 text-blue-800'
                          : guard.status === 'إيقاف الراتب مؤقتاً' || guard.status === 'مكفوف اليد'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
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
                        
                        {(AuthService.hasSpecificPermission('guards.edit') || AuthService.hasSpecificPermission('admin')) && (
                          <button
                            onClick={() => handleEditGuard(guard)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(AuthService.hasSpecificPermission('guards.delete') || AuthService.hasSpecificPermission('admin')) && (
                          <button
                            onClick={() => handleDeleteGuard(guard.id, guard.guard_name)}
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
        totalItems={totalGuards}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Results Summary */}
      <div className="text-center text-gray-600">
        عرض {filteredGuards.length} من أصل {totalGuards} نتيجة مفلترة • إجمالي الحراس في النظام: {overallStats.total}
      </div>

      {/* Modals */}
      {showGuardForm && (
        <GuardForm
          guard={selectedGuard ?? undefined}
          schools={schools}
          onSubmit={handleGuardSubmit}
          onCancel={() => {
            setShowGuardForm(false);
            setSelectedGuard(null);
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
    </div>
  );
};