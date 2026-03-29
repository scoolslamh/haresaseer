/**
 * أدوات تطبيع النصوص العربية
 * لحل مشكلة التاء المربوطة والهاء في البحث والاستيراد
 */

/**
 * تطبيع النص العربي لتوحيد التاء المربوطة والهاء
 * @param text النص المراد تطبيعه
 * @returns النص بعد التطبيع
 */
export function normalizeArabicText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  return text
    // توحيد التاء المربوطة (ة) والهاء (ه)
    .replace(/ة/g, 'ه')
    // إزالة التشكيل (الحركات)
    .replace(/[\u064B-\u0652]/g, '')
    // توحيد الألف
    .replace(/[آأإ]/g, 'ا')
    // توحيد الياء
    .replace(/ى/g, 'ي')
    // إزالة المسافات الزائدة
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * مقارنة نصين عربيين مع التطبيع
 * @param text1 النص الأول
 * @param text2 النص الثاني
 * @returns true إذا كان النصان متطابقان بعد التطبيع
 */
export function compareArabicTexts(text1: string, text2: string): boolean {
  return normalizeArabicText(text1).toLowerCase() === normalizeArabicText(text2).toLowerCase();
}

/**
 * البحث في النص العربي مع التطبيع
 * @param text النص المراد البحث فيه
 * @param searchTerm مصطلح البحث
 * @returns true إذا كان النص يحتوي على مصطلح البحث
 */
export function searchInArabicText(text: string, searchTerm: string): boolean {
  if (!text) return false;
  if (!searchTerm || searchTerm.trim() === '') return true; // البحث الفارغ يطابق كل شيء
  
  const normalizedText = normalizeArabicText(text).toLowerCase();
  const normalizedSearch = normalizeArabicText(searchTerm).toLowerCase();
  
  return normalizedText.includes(normalizedSearch);
}

/**
 * تطبيع مصفوفة من النصوص العربية
 * @param texts مصفوفة النصوص
 * @returns مصفوفة النصوص بعد التطبيع
 */
export function normalizeArabicTexts(texts: string[]): string[] {
  return texts.map(text => normalizeArabicText(text));
}

/**
 * تنظيف نص رسالة الخطأ قبل عرضها للمستخدم
 * يزيل أي وسوم HTML محتملة كطبقة حماية إضافية
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') return 'حدث خطأ غير متوقع';
  return message
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .substring(0, 300);
}

/**
 * تهريب المحارف الخاصة في نمط LIKE لمنع التلاعب بالبحث
 * يهرب: % _ \
 * @param term مصطلح البحث
 * @returns مصطلح البحث بعد التهريب
 */
export function escapeLikePattern(term: string): string {
  if (!term || typeof term !== 'string') return '';
  return term
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}