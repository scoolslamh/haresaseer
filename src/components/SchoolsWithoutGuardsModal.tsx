import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  AlertTriangle,
  RefreshCw,
  Search,
  Plus
} from 'lucide-react';
import { School } from '../types';
import { DashboardService } from '../services/dashboardService';

interface SchoolsWithoutGuardsModalProps {
  onClose: () => void;
  onAddGuard?: (schoolId: string) => void;
}

export const SchoolsWithoutGuardsModal: React.FC<SchoolsWithoutGuardsModalProps> = ({
  onClose,
  onAddGuard
}) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [schools, searchTerm, selectedRegion]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 تحميل المدارس بدون حراس في المودال...');
      const schoolsData = await DashboardService.getSchoolsWithoutGuards();
      console.log(`📋 تم تحميل ${schoolsData.length} مدرسة بدون حراس في المودال`);
      setSchools(schoolsData);
    } catch (err: any) {
      console.error('❌ خطأ في تحميل المدارس في المودال:', err);
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schools];

    // البحث النصي
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(school =>
        school.school_name.toLowerCase().includes(searchLower) ||
        school.governorate.toLowerCase().includes(searchLower) ||
        school.principal_name?.toLowerCase().includes(searchLower)
      );
    }

    // تصفية حسب المنطقة
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(school => school.region === selectedRegion);
    }

    setFilteredSchools(filtered);
  };

  const handleAddGuardClick = (schoolId: string) => {
    if (onAddGuard) {
      onAddGuard(schoolId);
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moe-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">المدارس بدون حراس</h2>
              <p className="text-sm text-gray-600">
                {filteredSchools.length} مدرسة تحتاج إلى تعيين حراس
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadSchools}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث باسم المدرسة، المحافظة، أو المدير..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="all">جميع المناطق</option>
                <option value="عسير">عسير</option>
                <option value="جيزان">جيزان</option>
                <option value="الباحة">الباحة</option>
                <option value="نجران">نجران</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schools List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSchools.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {searchTerm || selectedRegion !== 'all' 
                  ? 'لا توجد مدارس تطابق البحث' 
                  : 'جميع المدارس لديها حراس!'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedRegion !== 'all'
                  ? 'جرب تغيير معايير البحث'
                  : 'هذا أمر رائع! جميع المدارس النشطة لديها حراس مُعينين'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchools.map((school) => (
                <div key={school.id} className="bg-white border border-red-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                          {school.school_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {school.region} - {school.governorate}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      بدون حارس
                    </div>
                  </div>

                  {/* معلومات المدير */}
                  {(school.principal_name || school.principal_mobile) && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        معلومات المدير/ة
                      </h4>
                      {school.principal_name && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">الاسم:</span> {school.principal_name}
                        </p>
                      )}
                      {school.principal_mobile && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600" dir="ltr">
                            {school.principal_mobile}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* زر إضافة حارس */}
                  {onAddGuard && (
                    <button
                      onClick={() => handleAddGuardClick(school.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة حارس لهذه المدرسة
                    </button>
                  )}

                  {/* معلومات إضافية */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>تاريخ الإضافة</span>
                      <span>{new Date(school.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              عرض {filteredSchools.length} من أصل {schools.length} مدرسة بدون حراس
            </div>
            <div className="text-xs text-gray-500">
              آخر تحديث: {new Date().toLocaleString('ar-SA')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};