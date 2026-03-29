import React, { useState } from 'react';
import { useEffect } from 'react';
import { Guard, School as SchoolType } from '../types';
import { X, ArrowRightLeft, User, School, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GuardService } from '../services/guardService';
import { SchoolService } from '../services/schoolService';
import { ConfirmationMessage } from './ConfirmationMessage';

interface TransferGuardModalProps {
  guard?: Guard | null;
  guards: Guard[];
  schools: SchoolType[];
  onSubmit: (guardId: string, newSchoolId: string, description: string) => Promise<void>;
  onClose: () => void;
}

export const TransferGuardModal: React.FC<TransferGuardModalProps> = ({
  guard,
  guards: initialGuards,
  schools: initialSchools,
  onSubmit,
  onClose
}) => {
  const [allGuards, setAllGuards] = useState<Guard[]>(initialGuards);
  const [allSchools, setAllSchools] = useState<SchoolType[]>(initialSchools);
  const [filteredGuards, setFilteredGuards] = useState<Guard[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolType[]>([]);
  const [guardSearchTerm, setGuardSearchTerm] = useState('');
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    guardId: guard?.id || '',
    newSchoolId: '',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');

  // تحميل جميع البيانات عند فتح المودال
  useEffect(() => {
    loadAllData();
  }, []);

  // تطبيق البحث على الحراس
  useEffect(() => {
    if (!guardSearchTerm.trim()) {
      setFilteredGuards(allGuards.filter(g => g.school_id)); // فقط الحراس المسندين
    } else {
      const searchLower = guardSearchTerm.toLowerCase();
      setFilteredGuards(
        allGuards
          .filter(g => g.school_id) // فقط الحراس المسندين
          .filter(g => 
            g.guard_name.toLowerCase().includes(searchLower) ||
            g.school?.school_name?.toLowerCase().includes(searchLower) ||
            g.school?.region?.toLowerCase().includes(searchLower) ||
            g.civil_id?.toLowerCase().includes(searchLower)
          )
      );
    }
  }, [allGuards, guardSearchTerm]);

  // تطبيق البحث على المدارس
  useEffect(() => {
    if (!schoolSearchTerm.trim()) {
      setFilteredSchools(allSchools);
    } else {
      const searchLower = schoolSearchTerm.toLowerCase();
      setFilteredSchools(
        allSchools.filter(s => 
          s.school_name.toLowerCase().includes(searchLower) ||
          s.region.toLowerCase().includes(searchLower) ||
          s.governorate.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [allSchools, schoolSearchTerm]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      console.log('🔄 بدء تحميل جميع البيانات...');
      
      // جلب جميع الحراس بدون حد
      let allGuardsData: Guard[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: pageData, error: guardsError } = await supabase
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
          .not('school_id', 'is', null)
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('guard_name');

        if (guardsError) {
          console.error('❌ خطأ في جلب الحراس:', guardsError);
          throw guardsError;
        }

        if (!pageData || pageData.length === 0) break;
        const formattedData = pageData.map((g: any) => ({
  ...g,
  school: Array.isArray(g.school) ? g.school[0] : g.school
}));
        
        allGuardsData = [...allGuardsData, ...formattedData];
        page++;
        
        if (pageData.length < pageSize) break;
      }

      // جلب جميع المدارس بدون حد
      let allSchoolsData: SchoolType[] = []; // ✅ هنا التعديل
page = 0;
      
      while (true) {
        const { data: pageData, error: schoolsError } = await supabase
          .from('schools')
          .select('*')
          .eq('status', 'نشط')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('school_name');

        if (schoolsError) {
          console.error('❌ خطأ في جلب المدارس:', schoolsError);
          throw schoolsError;
        }

        if (!pageData || pageData.length === 0) break;
        
        allSchoolsData = [...allSchoolsData, ...pageData];
        page++;
        
        if (pageData.length < pageSize) break;
      }

      console.log(`✅ تم تحميل ${allGuardsData.length} حارس و ${allSchoolsData.length} مدرسة`);
      
      setAllGuards(allGuardsData);
      setAllSchools(allSchoolsData);
    } catch (err: any) {
      console.error('خطأ في تحميل البيانات:', err);
      setError('خطأ في تحميل البيانات من قاعدة البيانات');
      // في حالة الخطأ، استخدم البيانات الأولية
      setAllGuards(initialGuards);
      setAllSchools(initialSchools);
    } finally {
      setLoading(false);
    }
  };

  const selectedGuard = filteredGuards.find(g => g.id === formData.guardId) || 
                      allGuards.find(g => g.id === formData.guardId);
  const selectedSchool = filteredSchools.find(s => s.id === formData.newSchoolId) || 
                        allSchools.find(s => s.id === formData.newSchoolId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guardId || !formData.newSchoolId) {
      setError('يرجى اختيار الحارس والمدرسة الجديدة');
      return;
    }

    if (selectedGuard?.school_id === formData.newSchoolId) {
      setError('الحارس موجود بالفعل في هذه المدرسة');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const description = formData.description || 
        `نقل الحارس ${selectedGuard?.guard_name} من ${selectedGuard?.school?.school_name || 'غير محدد'} إلى ${selectedSchool?.school_name}`;
      
      await onSubmit(formData.guardId, formData.newSchoolId, description);
      
      // عرض رسالة التأكيد
      setConfirmationText(`تم نقل الحارس ${selectedGuard?.guard_name} بنجاح!`);
      setConfirmationType('success');
      setShowConfirmation(true);
      
      // إغلاق النموذج بعد ثانيتين
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في نقل الحارس';
      setError(errorMessage);
      setConfirmationText(errorMessage);
      setConfirmationType('error');
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">نقل حارس</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* اختيار الحارس */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر الحارس *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={guardSearchTerm}
                onChange={(e) => setGuardSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، المدرسة، المنطقة، السجل المدني..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              />
              <select
                name="guardId"
                value={formData.guardId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="">اختر الحارس ({filteredGuards.length} من {allGuards.length})</option>
                {filteredGuards.map(guard => (
                  <option key={guard.id} value={guard.id}>
                    {guard.guard_name} - {guard.school?.school_name} - {guard.school?.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* معلومات الحارس الحالية */}
          {selectedGuard && (
            <div className="bg-moe-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-moe-800 mb-2">المعلومات الحالية:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-moe-700 font-medium">الاسم: </span>
                  <span className="text-moe-800">{selectedGuard.guard_name}</span>
                </div>
                <div>
                  <span className="text-moe-700 font-medium">المدرسة الحالية: </span>
                  <span className="text-moe-800">
                    {selectedGuard.school?.school_name || 'غير مرتبط بمدرسة'}
                  </span>
                </div>
                <div>
                  <span className="text-moe-700 font-medium">المنطقة: </span>
                  <span className="text-moe-800">
                    {selectedGuard.school?.region || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-moe-700 font-medium">المحافظة: </span>
                  <span className="text-moe-800">
                    {selectedGuard.school?.governorate || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* اختيار المدرسة الجديدة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المدرسة الجديدة *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={schoolSearchTerm}
                onChange={(e) => setSchoolSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، المنطقة، المحافظة..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              />
              <select
                name="newSchoolId"
                value={formData.newSchoolId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent"
              >
                <option value="">اختر المدرسة الجديدة ({filteredSchools.filter(s => s.id !== selectedGuard?.school_id).length} من {allSchools.length})</option>
                {filteredSchools
                  .filter(school => school.id !== selectedGuard?.school_id)
                  .map(school => (
                    <option key={school.id} value={school.id}>
                      {school.school_name} - {school.region} - {school.governorate}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* معلومات المدرسة الجديدة */}
          {selectedSchool && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">معلومات المدرسة الجديدة:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-700 font-medium">اسم المدرسة: </span>
                  <span className="text-green-800">{selectedSchool.school_name}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">رقم الملف: </span>
                  <span className="text-green-800">{selectedSchool.file_number}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">المنطقة: </span>
                  <span className="text-green-800">{selectedSchool.region}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">المحافظة: </span>
                  <span className="text-green-800">{selectedSchool.governorate}</span>
                </div>
                {selectedSchool.principal_name && (
                  <div>
                    <span className="text-green-700 font-medium">المدير/ة: </span>
                    <span className="text-green-800">{selectedSchool.principal_name}</span>
                  </div>
                )}
                {selectedSchool.principal_mobile && (
                  <div>
                    <span className="text-green-700 font-medium">جوال المدير: </span>
                    <span className="text-green-800" dir="ltr">{selectedSchool.principal_mobile}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* وصف العملية */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف العملية (اختياري)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-500 focus:border-transparent resize-none"
              placeholder="أدخل وصف مفصل لعملية النقل..."
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !formData.guardId || !formData.newSchoolId}
              className="flex-1 bg-moe-600 text-white py-2 px-4 rounded-lg hover:bg-moe-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'جاري النقل...' : 'تأكيد النقل'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
      
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