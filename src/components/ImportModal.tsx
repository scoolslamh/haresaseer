import React, { useState, useRef } from 'react';
import { Upload, Download, X, FileText, AlertCircle } from 'lucide-react';
import { CSVParser } from '../utils/csvParser';
import { GuardFormData } from '../types/guard';

interface ImportModalProps {
  onImport: (guards: GuardFormData[]) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  onImport,
  onClose,
  isLoading = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<GuardFormData[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPreviewData(null);

    if (!file.name.endsWith('.csv')) {
      setError('يرجى اختيار ملف CSV فقط');
      return;
    }

    try {
      const content = await file.text();
      const importData = CSVParser.parseCSV(content);
      const validatedData = CSVParser.validateAndConvertData(importData);
      setPreviewData(validatedData);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'خطأ في قراءة الملف');
    }
  };

  const handleImport = async () => {
    if (previewData) {
      await onImport(previewData);
    }
  };

  const downloadSample = () => {
    const sampleCSV = CSVParser.generateSampleCSV();
    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'نموذج_حراس_المدارس.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-moe-600" />
            <h2 className="text-xl font-bold text-gray-800">استيراد حراس من ملف CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!previewData ? (
            <div className="space-y-6">
              <div className="bg-moe-50 border border-moe-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-moe-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-moe-800 mb-2">تعليمات الاستيراد:</h3>
                    <ul className="text-sm text-moe-700 space-y-1">
                      <li>• يجب أن يكون الملف بصيغة CSV</li>
                      <li>• الأعمدة المطلوبة: الاسم، المدرسة</li>
                      <li>• الأعمدة الاختيارية: الهاتف، الوردية، تاريخ التوظيف، الراتب، الحالة، ملاحظات</li>
                      <li>• يمكن استخدام أسماء الأعمدة بالعربية أو الإنجليزية</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={downloadSample}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  تحميل ملف نموذج
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-moe-500 bg-moe-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  اسحب وأفلت ملف CSV هنا
                </p>
                <p className="text-gray-500 mb-4">أو</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-moe-600 text-white rounded-lg hover:bg-moe-700 transition-colors"
                >
                  اختر ملف
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  تم العثور على {previewData.length} حارس في الملف. يرجى مراجعة البيانات قبل الاستيراد.
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right">الاسم</th>
                      <th className="px-4 py-2 text-right">المدرسة</th>
                      <th className="px-4 py-2 text-right">الهاتف</th>
                      <th className="px-4 py-2 text-right">الوردية</th>
                      <th className="px-4 py-2 text-right">الراتب</th>
                      <th className="px-4 py-2 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((guard, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{guard.name}</td>
                        <td className="px-4 py-2">{guard.school_name}</td>
                        <td className="px-4 py-2">{guard.phone || '-'}</td>
                        <td className="px-4 py-2">{guard.shift}</td>
                        <td className="px-4 py-2">{guard.salary} ريال</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            guard.status === 'نشط' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {guard.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="flex-1 bg-moe-600 text-white py-2 px-4 rounded-lg hover:bg-moe-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'جاري الاستيراد...' : `استيراد ${previewData.length} حارس`}
                </button>
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};