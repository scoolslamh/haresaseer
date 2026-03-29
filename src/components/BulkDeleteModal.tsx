import React, { useState } from 'react';
import { useEffect } from 'react';
import { Guard, School } from '../types';
import { X, Trash2, Users, Building, AlertTriangle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GuardService } from '../services/guardService';
import { SchoolService } from '../services/schoolService';

interface BulkDeleteModalProps {
  guards: Guard[]; // للعرض الأولي
  schools: School[]; // للعرض الأولي
  onSubmit: (type: string, ids: string[]) => Promise<void>;
  onClose: () => void;
  onDeleteGuard: (guard: Guard) => Promise<void>;
  onDeleteSchool: (school: School) => Promise<void>;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  guards: initialGuards,
  schools: initialSchools,
  onSubmit,
  onClose,
  onDeleteGuard,
  onDeleteSchool
}) => {
  const [activeTab, setActiveTab] = useState<'guards' | 'schools' | 'individual'>('guards');
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [allGuards, setAllGuards] = useState<Guard[]>(initialGuards);
  const [allSchools, setAllSchools] = useState<School[]>(initialSchools);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحميل جميع البيانات عند فتح المودال
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setDataLoading(true);
      setError(null); // Clear previous errors

      // --- Fetch all guards ---
      const { data: allGuardsData, error: guardsError } = await supabase
        .from('guards')
        .select(`
          id,
          school_id,
          guard_name,
          civil_id,
          gender,
          birth_date,
          insurance,
          start_date,
          mobile,
          iban,
          file,
          status,
          notes,
          created_at,
          updated_at,
          school:schools(*)
        `)
        .order('guard_name')
        .limit(50000); // جلب جميع الحراس

      if (guardsError) throw guardsError;
      
      // --- Fetch all schools ---
      const { data: allSchoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('school_name')
        .limit(50000); // جلب جميع المدارس

      if (schoolsError) throw schoolsError;
      
      console.log(`✅ تم تحميل ${allGuardsData.length} حارس و ${allSchoolsData.length} مدرسة`);
      
      setAllGuards(allGuardsData);
      setAllSchools(allSchoolsData);
    } catch (err: any) {
      console.error('خطأ في تحميل البيانات:', err);
      // جلب جميع الحراس والمدارس بدون حد (إزالة حد Supabase الافتراضي)
      // في حالة الخطأ، استخدم البيانات الأولية
      setAllGuards(initialGuards);
      setAllSchools(initialSchools);
    } finally {
      setDataLoading(false);
    }
  };

  const filteredGuards = allGuards.filter(guard => 
    guard.guard_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guard.school?.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSchools = allSchools.filter(school => 
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGuardSelection = (guardId: string) => {
    setSelectedGuards(prev => 
      prev.includes(guardId) 
        ? prev.filter(id => id !== guardId)
        : [...prev, guardId]
    );
  };

  const handleSchoolSelection = (schoolId: string) => {
    setSelectedSchools(prev => 
      prev.includes(schoolId) 
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const handleSelectAllGuards = () => {
    if (selectedGuards.length === filteredGuards.length) {
      setSelectedGuards([]);
    } else {
      setSelectedGuards(filteredGuards.map(g => g.id));
    }
  };

  const handleSelectAllSchools = () => {
    if (selectedSchools.length === filteredSchools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(filteredSchools.map(s => s.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'guards' && selectedGuards.length > 0) {
        await onSubmit('guards', selectedGuards);
      } else if (activeTab === 'schools' && selectedSchools.length > 0) {
        await onSubmit('schools', selectedSchools);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في الحذف');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualDelete = async (type: 'guard' | 'school', item: Guard | School) => {
    try {
      if (type === 'guard') {
        await onDeleteGuard(item as Guard);
      } else {
        await onDeleteSchool(item as School);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في الحذف');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-bold text-gray-800">إدارة الحذف</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('guards')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'guards'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              حذف الحراس ({selectedGuards.length})
            </button>
            <button
              onClick={() => setActiveTab('schools')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'schools'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4 inline mr-2" />
              حذف المدارس ({selectedSchools.length})
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'individual'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              حذف فردي
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث..."
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Guards Tab */}
          {activeTab === 'guards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">اختيار الحراس للحذف</h3>
                <button
                  onClick={handleSelectAllGuards}
                  className="text-sm text-moe-600 hover:text-moe-800"
                >
                  {selectedGuards.length === filteredGuards.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredGuards.map(guard => (
                  <div key={guard.id} className="flex items-center p-3 border-b hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedGuards.includes(guard.id)}
                      onChange={() => handleGuardSelection(guard.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{guard.guard_name}</p>
                      <p className="text-sm text-gray-600">
                        {guard.school?.school_name || 'غير مرتبط بمدرسة'} - {guard.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedGuards.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    سيتم حذف {selectedGuards.length} حارس نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Schools Tab */}
          {activeTab === 'schools' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">اختيار المدارس للحذف</h3>
                <button
                  onClick={handleSelectAllSchools}
                  className="text-sm text-moe-600 hover:text-moe-800"
                >
                  {selectedSchools.length === filteredSchools.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredSchools.map(school => (
                  <div key={school.id} className="flex items-center p-3 border-b hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedSchools.includes(school.id)}
                      onChange={() => handleSchoolSelection(school.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{school.school_name}</p>
                      <p className="text-sm text-gray-600">
                        {school.region} - {school.governorate} - {school.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedSchools.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    سيتم حذف {selectedSchools.length} مدرسة نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Individual Delete Tab */}
          {activeTab === 'individual' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">حذف فردي</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guards */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">الحراس</h4>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {filteredGuards.map(guard => (
                      <div key={guard.id} className="flex items-center justify-between p-2 border-b hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{guard.guard_name}</p>
                          <p className="text-xs text-gray-600">{guard.school?.school_name || 'غير مرتبط'}</p>
                        </div>
                        <button
                          onClick={() => handleIndividualDelete('guard', guard)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schools */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">المدارس</h4>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {filteredSchools.map(school => (
                      <div key={school.id} className="flex items-center justify-between p-2 border-b hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{school.school_name}</p>
                          <p className="text-xs text-gray-600">{school.region} - {school.governorate}</p>
                        </div>
                        <button
                          onClick={() => handleIndividualDelete('school', school)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {activeTab !== 'individual' && (
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleBulkDelete}
                disabled={loading || (activeTab === 'guards' ? selectedGuards.length === 0 : selectedSchools.length === 0)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'جاري الحذف...' : `حذف ${activeTab === 'guards' ? selectedGuards.length : selectedSchools.length} عنصر`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};