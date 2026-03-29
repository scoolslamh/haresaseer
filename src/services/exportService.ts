import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Guard } from '../types';

// تمديد نوع jsPDF لإضافة autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class ExportService {
  static async exportToExcel(guards: Guard[], filename: string = 'guards_data') {
    if (!guards || guards.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      const exportData = guards.map(guard => ({
        'اسم الحارس': guard.guard_name,
        'المدرسة': guard.school?.school_name || '',
        'المنطقة': guard.school?.region || '',
        'المحافظة': guard.school?.governorate || '',
        'المدير/ة': guard.school?.principal_name || '',
        'جوال المدير': guard.school?.principal_mobile || '',
        'السجل المدني': guard.civil_id || '',
        'الملف': guard.file || '',
        'الجنس': guard.gender || '',
        'تاريخ الميلاد': guard.birth_date || '',
        'التأمينات': guard.insurance || '',
        'تاريخ المباشرة': guard.start_date || '',
        'رقم الجوال': guard.mobile || '',
        'الآيبان': guard.iban || '',
        'الحالة': guard.status,
        'ملاحظات': guard.notes || '',
        'تاريخ الإنشاء': new Date(guard.created_at).toLocaleDateString('ar-SA'),
        'آخر تحديث': new Date(guard.updated_at).toLocaleDateString('ar-SA')
      }));

      // إنشاء workbook و worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 20 }, // اسم الحارس
        { wch: 30 }, // المدرسة
        { wch: 15 }, // المنطقة
        { wch: 15 }, // المحافظة
        { wch: 20 }, // المدير
        { wch: 15 }, // جوال المدير
        { wch: 15 }, // السجل المدني
        { wch: 15 }, // الملف
        { wch: 10 }, // الجنس
        { wch: 15 }, // تاريخ الميلاد
        { wch: 10 }, // التأمينات
        { wch: 15 }, // تاريخ المباشرة
        { wch: 15 }, // رقم الجوال
        { wch: 25 }, // الآيبان
        { wch: 10 }, // الحالة
        { wch: 30 }, // ملاحظات
        { wch: 15 }, // تاريخ الإنشاء
        { wch: 15 }  // آخر تحديث
      ];
      ws['!cols'] = colWidths;

      // إضافة الورقة إلى الكتاب
      XLSX.utils.book_append_sheet(wb, ws, 'بيانات الحراس');

      // تصدير الملف
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف Excel: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }

  static async exportToPDF(guards: Guard[], title: string = 'بيانات الحراس') {
    if (!guards || guards.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      // إنشاء مستند PDF جديد
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation

      // إعداد الخط العربي (إذا كان متوفراً)
      doc.setFont('helvetica');
      
      // إضافة رأس الصفحة مع الشعار واسم الشركة
      const addHeader = () => {
        // شعار الشركة على اليسار
        doc.setFontSize(12);
        doc.text('🛡️', 20, 15);
        
        // اسم الشركة على اليمين
        doc.setFontSize(14);
        doc.text('نظام بوّاب', doc.internal.pageSize.width - 20, 15, { align: 'right' });
        
        // خط فاصل
        doc.setLineWidth(0.5);
        doc.line(20, 20, doc.internal.pageSize.width - 20, 20);
      };
      
      // إضافة الرأس للصفحة الأولى
      addHeader();
      
      // عنوان التقرير
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      
      // تاريخ التقرير
      doc.setFontSize(10);
      doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, doc.internal.pageSize.width - 20, 40, { align: 'right' });

      // تحضير البيانات للجدول
      const tableData = guards.map(guard => [
        guard.guard_name,
        guard.school?.school_name || '-',
        guard.school?.region || '-',
        guard.school?.governorate || '-',
        guard.gender || '-',
        guard.insurance || '-',
        guard.mobile || '-',
        guard.status === 'مبعد عن المدارس' ? 'مبعد' : guard.status
      ]);

      // رؤوس الأعمدة
      const headers = [
        'اسم الحارس',
        'المدرسة',
        'المنطقة',
        'المحافظة',
        'الجنس',
        'التأمين',
        'الجوال',
        'الحالة'
      ];

      // إنشاء الجدول
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center'
        },
        headStyles: {
          fillColor: [13, 71, 161], // اللون الأزرق الغامق
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 35 }, // اسم الحارس
          1: { cellWidth: 40 }, // المدرسة
          2: { cellWidth: 20 }, // المنطقة
          3: { cellWidth: 20 }, // المحافظة
          4: { cellWidth: 15 }, // الجنس
          5: { cellWidth: 15 }, // التأمين
          6: { cellWidth: 25 }, // الجوال
          7: { cellWidth: 20 }  // الحالة
        },
        margin: { top: 50, right: 10, bottom: 20, left: 10 },
        didDrawPage: function (data: any) {
          // إضافة الرأس لكل صفحة جديدة
          if (data.pageNumber > 1) {
            addHeader();
          }
          
          // إضافة رقم الصفحة
          doc.setFontSize(8);
          doc.text(
            `صفحة ${data.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      // إضافة إحصائيات في نهاية التقرير
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text('إحصائيات التقرير:', 20, finalY);
      
      doc.setFontSize(10);
      const stats = [
        `إجمالي الحراس: ${guards.length}`,
        `الذكور: ${guards.filter(g => g.gender === 'ذكر').length}`,
        `الإناث: ${guards.filter(g => g.gender === 'أنثى').length}`,
        `المؤمنين: ${guards.filter(g => g.insurance === 'نعم').length}`,
        `النشطين: ${guards.filter(g => g.status === 'نشط').length}`
      ];

      stats.forEach((stat, index) => {
        doc.text(stat, 20, finalY + 15 + (index * 8));
      });

      // حفظ الملف
      doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف PDF: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }

  static async exportOperationsToExcel(operations: Operation[], filename: string = 'operations_log') {
    if (!operations || operations.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      const exportData = operations.map(operation => ({
        'نوع العملية': operation.operation_type,
        'الوصف': operation.description,
        'الحارس': operation.guard?.guard_name || '-',
        'السجل المدني': operation.guard?.civil_id || '-',
        'المدرسة المصدر': operation.school_from?.school_name || '-',
        'رقم ملف المصدر': operation.school_from?.file_number || '-',
        'منطقة المصدر': operation.school_from?.region || '-',
        'المدرسة الهدف': operation.school_to?.school_name || '-',
        'رقم ملف الهدف': operation.school_to?.file_number || '-',
        'منطقة الهدف': operation.school_to?.region || '-',
        'المنفذ': operation.user?.full_name || 'غير محدد',
        'تاريخ التنفيذ': new Date(operation.created_at).toLocaleString('ar-SA'),
        'معرف العملية': operation.id
      }));

      // إنشاء workbook و worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 15 }, // نوع العملية
        { wch: 40 }, // الوصف
        { wch: 20 }, // الحارس
        { wch: 15 }, // السجل المدني
        { wch: 30 }, // المدرسة المصدر
        { wch: 15 }, // منطقة المصدر
        { wch: 30 }, // المدرسة الهدف
        { wch: 15 }, // منطقة الهدف
        { wch: 20 }, // المنفذ
        { wch: 20 }, // تاريخ التنفيذ
        { wch: 25 }  // معرف العملية
      ];
      ws['!cols'] = colWidths;

      // إضافة الورقة إلى الكتاب
      XLSX.utils.book_append_sheet(wb, ws, 'سجل العمليات');

      // تصدير الملف
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف Excel: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }

  static async exportOperationsToPDF(operations: Operation[], title: string = 'سجل العمليات') {
    if (!operations || operations.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFont('helvetica');
      const addHeader = () => {
        doc.setFontSize(12);
        doc.text('🛡️', 20, 15);
        
        // اسم الشركة على اليمين
        doc.setFontSize(14);
        doc.text('نظام بوّاب', doc.internal.pageSize.width - 20, 15, { align: 'right' });
        
        // خط فاصل
        doc.setLineWidth(0.5);
        doc.line(20, 20, doc.internal.pageSize.width - 20, 20);
      };
      
      // إضافة الرأس للصفحة الأولى
      addHeader();
      
      // عنوان التقرير
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      
      // تاريخ التقرير
      doc.setFontSize(10);
      doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, doc.internal.pageSize.width - 20, 40, { align: 'right' });

      // تحضير البيانات للجدول
      const tableData = operations.map(operation => [
        operation.operation_type,
        operation.description.length > 30 ? operation.description.substring(0, 30) + '...' : operation.description,
        operation.guard?.guard_name || '-',
        operation.school_from?.school_name?.substring(0, 20) || '-',
        operation.school_to?.school_name?.substring(0, 20) || '-',
        operation.user?.full_name || 'غير محدد',
        new Date(operation.created_at).toLocaleDateString('ar-SA')
      ]);

      // رؤوس الأعمدة
      const headers = [
        'نوع العملية',
        'الوصف',
        'الحارس',
        'من مدرسة',
        'إلى مدرسة',
        'المنفذ',
        'التاريخ'
      ];

      // إنشاء الجدول
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center'
        },
        headStyles: {
          fillColor: [13, 71, 161], // اللون الأزرق الغامق
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 25 }, // نوع العملية
          1: { cellWidth: 50 }, // الوصف
          2: { cellWidth: 30 }, // الحارس
          3: { cellWidth: 40 }, // من مدرسة
          4: { cellWidth: 40 }, // إلى مدرسة
          5: { cellWidth: 25 }, // المنفذ
          6: { cellWidth: 25 }  // التاريخ
        },
        margin: { top: 50, right: 10, bottom: 20, left: 10 },
        didDrawPage: function (data: any) {
          // إضافة الرأس لكل صفحة جديدة
          if (data.pageNumber > 1) {
            addHeader();
          }
          
          // إضافة رقم الصفحة
          doc.setFontSize(8);
          doc.text(
            `صفحة ${data.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      // إضافة إحصائيات في نهاية التقرير
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text('إحصائيات التقرير:', 20, finalY);
      
      doc.setFontSize(10);
      const stats = [
        `إجمالي العمليات: ${operations.length}`,
        `عمليات النقل: ${operations.filter(op => op.operation_type === 'نقل').length}`,
        `إضافة حراس: ${operations.filter(op => op.operation_type === 'إضافة حارس').length}`,
        `تعديل البيانات: ${operations.filter(op => op.operation_type === 'تعديل بيانات').length}`,
        `إضافة مدارس: ${operations.filter(op => op.operation_type === 'إضافة مدرسة').length}`
      ];

      stats.forEach((stat, index) => {
        doc.text(stat, 20, finalY + 15 + (index * 8));
      });

      // حفظ الملف
      doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف PDF: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }

  static async exportSchoolsToExcel(schools: School[], filename: string = 'schools_data') {
    if (!schools || schools.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      const exportData = schools.map(school => ({
        'اسم المدرسة': school.school_name,
        'المنطقة': school.region,
        'المحافظة': school.governorate,
        'المدير/ة': school.principal_name || '',
        'جوال المدير': school.principal_mobile || '',
        'الحالة': school.status,
        'ملاحظات': school.notes || '',
        'تاريخ الإنشاء': new Date(school.created_at).toLocaleDateString('ar-SA'),
        'آخر تحديث': new Date(school.updated_at).toLocaleDateString('ar-SA')
      }));

      // إنشاء workbook و worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 35 }, // اسم المدرسة
        { wch: 15 }, // المنطقة
        { wch: 15 }, // المحافظة
        { wch: 20 }, // المدير
        { wch: 15 }, // جوال المدير
        { wch: 10 }, // الحالة
        { wch: 30 }, // ملاحظات
        { wch: 15 }, // تاريخ الإنشاء
        { wch: 15 }  // آخر تحديث
      ];
      ws['!cols'] = colWidths;

      // إضافة الورقة إلى الكتاب
      XLSX.utils.book_append_sheet(wb, ws, 'بيانات المدارس');

      // تصدير الملف
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف Excel: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }

  static async exportSchoolsToPDF(schools: School[], title: string = 'بيانات المدارس') {
    if (!schools || schools.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      // إنشاء مستند PDF جديد
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation

      // إعداد الخط العربي (إذا كان متوفراً)
      doc.setFont('helvetica');
      
      // إضافة رأس الصفحة مع الشعار واسم الشركة
      const addHeader = () => {
        // شعار الشركة على اليسار
        doc.setFontSize(12);
        doc.text('🛡️', 20, 15);
        
        // اسم الشركة على اليمين
        doc.setFontSize(14);
        doc.text('نظام بوّاب', doc.internal.pageSize.width - 20, 15, { align: 'right' });
        
        // خط فاصل
        doc.setLineWidth(0.5);
        doc.line(20, 20, doc.internal.pageSize.width - 20, 20);
      };
      
      // إضافة الرأس للصفحة الأولى
      addHeader();
      
      // عنوان التقرير
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      
      // تاريخ التقرير
      doc.setFontSize(10);
      doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, doc.internal.pageSize.width - 20, 40, { align: 'right' });

      // تحضير البيانات للجدول
      const tableData = schools.map(school => [
        school.school_name,
        school.region,
        school.governorate,
        school.principal_name || '-',
        school.principal_mobile || '-',
        school.status
      ]);

      // رؤوس الأعمدة
      const headers = [
        'اسم المدرسة',
        'المنطقة',
        'المحافظة',
        'المدير/ة',
        'الجوال',
        'الحالة'
      ];

      // إنشاء الجدول
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center'
        },
        headStyles: {
          fillColor: [13, 71, 161], // اللون الأزرق الغامق
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 50 }, // اسم المدرسة
          1: { cellWidth: 25 }, // المنطقة
          2: { cellWidth: 25 }, // المحافظة
          3: { cellWidth: 35 }, // المدير
          4: { cellWidth: 30 }, // الجوال
          5: { cellWidth: 20 }  // الحالة
        },
        margin: { top: 50, right: 10, bottom: 20, left: 10 },
        didDrawPage: function (data: any) {
          // إضافة الرأس لكل صفحة جديدة
          if (data.pageNumber > 1) {
            addHeader();
          }
          
          // إضافة رقم الصفحة
          doc.setFontSize(8);
          doc.text(
            `صفحة ${data.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      // إضافة إحصائيات في نهاية التقرير
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text('إحصائيات التقرير:', 20, finalY);
      
      doc.setFontSize(10);
      const stats = [
        `إجمالي المدارس: ${schools.length}`,
        `المدارس النشطة: ${schools.filter(s => s.status === 'نشط').length}`,
        `المدارس غير النشطة: ${schools.filter(s => s.status === 'غير نشط').length}`,
        `مدارس عسير: ${schools.filter(s => s.region === 'عسير').length}`,
        `مدارس جيزان: ${schools.filter(s => s.region === 'جيزان').length}`
      ];

      stats.forEach((stat, index) => {
        doc.text(stat, 20, finalY + 15 + (index * 8));
      });

      // حفظ الملف
      doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف PDF: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }

  static async exportViolationsToExcel(violations: Violation[], filename: string = 'violations_data') {
    if (!violations || violations.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      const exportData = violations.map(violation => ({
        'نوع المخالفة': violation.violation_type,
        'اسم الحارس': violation.guard?.guard_name || '',
        'السجل المدني': violation.guard?.civil_id || '',
        'المدرسة': violation.guard?.school?.school_name || '',
        'المنطقة': violation.guard?.school?.region || '',
        'المحافظة': violation.guard?.school?.governorate || '',
        'تاريخ المخالفة': violation.violation_date || '',
        'وصف المخالفة': violation.description,
        'المُسجل بواسطة': violation.created_by || '',
        'تاريخ التسجيل': new Date(violation.created_at).toLocaleDateString('ar-SA'),
        'معرف المخالفة': violation.id
      }));

      // إنشاء workbook و worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 15 }, // نوع المخالفة
        { wch: 20 }, // اسم الحارس
        { wch: 15 }, // السجل المدني
        { wch: 30 }, // المدرسة
        { wch: 15 }, // المنطقة
        { wch: 15 }, // المحافظة
        { wch: 15 }, // تاريخ المخالفة
        { wch: 50 }, // وصف المخالفة
        { wch: 20 }, // المُسجل بواسطة
        { wch: 15 }, // تاريخ التسجيل
        { wch: 25 }  // معرف المخالفة
      ];
      ws['!cols'] = colWidths;

      // إضافة الورقة إلى الكتاب
      XLSX.utils.book_append_sheet(wb, ws, 'سجل المخالفات');

      // تصدير الملف
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف Excel: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }

  static async exportViolationsToPDF(violations: Violation[], title: string = 'سجل المخالفات') {
    if (!violations || violations.length === 0) throw new Error('لا توجد بيانات للتصدير');
    try {
      // إنشاء مستند PDF جديد
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation

      // إعداد الخط العربي (إذا كان متوفراً)
      doc.setFont('helvetica');
      
      // إضافة رأس الصفحة مع الشعار واسم الشركة
      const addHeader = () => {
        // شعار الشركة على اليسار
        doc.setFontSize(12);
        doc.text('🛡️', 20, 15);
        
        // اسم الشركة على اليمين
        doc.setFontSize(14);
        doc.text('نظام بوّاب', doc.internal.pageSize.width - 20, 15, { align: 'right' });
        
        // خط فاصل
        doc.setLineWidth(0.5);
        doc.line(20, 20, doc.internal.pageSize.width - 20, 20);
      };
      
      // إضافة الرأس للصفحة الأولى
      addHeader();
      
      // عنوان التقرير
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      
      // تاريخ التقرير
      doc.setFontSize(10);
      doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, doc.internal.pageSize.width - 20, 40, { align: 'right' });

      // تحضير البيانات للجدول
      const tableData = violations.map(violation => [
        violation.violation_type,
        violation.guard?.guard_name || '-',
        violation.guard?.school?.school_name?.substring(0, 25) || '-',
        violation.description.length > 30 ? violation.description.substring(0, 30) + '...' : violation.description,
        new Date(violation.violation_date).toLocaleDateString('ar-SA'),
        violation.created_by || '-',
        new Date(violation.created_at).toLocaleDateString('ar-SA')
      ]);

      // رؤوس الأعمدة
      const headers = [
        'النوع',
        'الحارس',
        'المدرسة',
        'الوصف',
        'تاريخ المخالفة',
        'المُسجل',
        'تاريخ التسجيل'
      ];

      // إنشاء الجدول
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center'
        },
        headStyles: {
          fillColor: [220, 38, 38], // اللون الأحمر
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 20 }, // النوع
          1: { cellWidth: 30 }, // الحارس
          2: { cellWidth: 40 }, // المدرسة
          3: { cellWidth: 50 }, // الوصف
          4: { cellWidth: 25 }, // تاريخ المخالفة
          5: { cellWidth: 25 }, // المُسجل
          6: { cellWidth: 25 }  // تاريخ التسجيل
        },
        margin: { top: 50, right: 10, bottom: 20, left: 10 },
        didDrawPage: function (data: any) {
          // إضافة الرأس لكل صفحة جديدة
          if (data.pageNumber > 1) {
            addHeader();
          }
          
          // إضافة رقم الصفحة
          doc.setFontSize(8);
          doc.text(
            `صفحة ${data.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      // إضافة إحصائيات في نهاية التقرير
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text('إحصائيات التقرير:', 20, finalY);
      
      doc.setFontSize(10);
      const stats = [
        `إجمالي المخالفات: ${violations.length}`,
        `الشكاوى: ${violations.filter(v => v.violation_type === 'شكوى').length}`,
        `الإنذارات: ${violations.filter(v => v.violation_type === 'إنذار').length}`,
        `المخالفات: ${violations.filter(v => v.violation_type === 'مخالفة').length}`
      ];

      stats.forEach((stat, index) => {
        doc.text(stat, 20, finalY + 15 + (index * 8));
      });

      // حفظ الملف
      doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      throw new Error('خطأ في تصدير ملف PDF: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  }
}