/**
 * Rate Limiter للحماية من هجمات Brute Force
 * يحد من عدد محاولات تسجيل الدخول الفاشلة
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 دقيقة حجب

// مخزن في الذاكرة — لا يمكن التلاعب به من localStorage
const attempts = new Map<string, AttemptRecord>();

export const rateLimiter = {
  /**
   * التحقق من إمكانية تسجيل الدخول
   * @returns null إذا كان مسموحاً، أو رسالة خطأ إذا تم الحجب
   */
  check(identifier: string): string | null {
    const now = Date.now();
    const key = identifier.toLowerCase().trim();
    const record = attempts.get(key);

    if (record) {
      // إذا كان محجوباً
      if (record.blockedUntil && now < record.blockedUntil) {
        const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        return `تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد ${remainingMinutes} دقيقة`;
      }

      // إعادة تعيين إذا انتهت نافذة الوقت
      if (now - record.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
      }
    }

    return null;
  },

  /**
   * تسجيل محاولة فاشلة
   */
  recordFailure(identifier: string): void {
    const now = Date.now();
    const key = identifier.toLowerCase().trim();
    const record = attempts.get(key);

    if (!record || now - record.firstAttempt > WINDOW_MS) {
      attempts.set(key, { count: 1, firstAttempt: now });
    } else {
      record.count += 1;
      if (record.count >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_DURATION_MS;
      }
      attempts.set(key, record);
    }
  },

  /**
   * مسح السجل عند نجاح تسجيل الدخول
   */
  recordSuccess(identifier: string): void {
    attempts.delete(identifier.toLowerCase().trim());
  }
};
