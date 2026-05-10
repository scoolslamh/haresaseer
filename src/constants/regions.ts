// المناطق النشطة حالياً في النظام
// عند توفر بيانات منطقة جديدة أضفها هنا
export const ACTIVE_REGIONS = ['عسير'] as const;
export type ActiveRegion = typeof ACTIVE_REGIONS[number];
