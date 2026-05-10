import React, { useState, useEffect } from "react";
import {
  Users,
  School,
  UserCheck,
  Shield,
  TrendingUp,
  MapPin,
  Building,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
} from "lucide-react";
import { DashboardService } from "../services/dashboardService";
import { DashboardStats } from "../types";
import { SchoolsWithoutGuardsModal } from "./SchoolsWithoutGuardsModal";
import { DashboardCharts } from "./DashboardCharts";

type GovernorateStat = {
  governorate: string;
  region: string;
  count: number;
  percentage: number;
};
export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSchoolsWithoutGuards, setShowSchoolsWithoutGuards] =
    useState(false);
  const [viewMode, setViewMode] = useState<"stats" | "charts">("stats");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await DashboardService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moe-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const malePercentage =
    stats.totalGuards > 0
      ? Math.round((stats.maleGuards / stats.totalGuards) * 100)
      : 0;
  const femalePercentage =
    stats.totalGuards > 0
      ? Math.round((stats.femaleGuards / stats.totalGuards) * 100)
      : 0;
  const insuredPercentage =
    stats.totalGuards > 0
      ? Math.round((stats.insuredGuards / stats.totalGuards) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الصفحة الرئيسية</h1>
          <p className="text-gray-600">نظرة عامة على إحصائيات النظام</p>
        </div>

        <div className="flex items-center gap-3">
          {/* أزرار التبديل بين العرض */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("stats")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === "stats"
                  ? "bg-white text-moe-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              إحصائيات
            </button>
            <button
              onClick={() => setViewMode("charts")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === "charts"
                  ? "bg-white text-moe-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <PieChart className="w-4 h-4" />
              رسوم بيانية
            </button>
          </div>

          <button
            onClick={loadStats}
            className="px-4 py-2 bg-moe-900 text-white rounded-lg hover:bg-moe-800 transition-colors"
          >
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* العرض الشرطي للمحتوى */}
      {viewMode === "stats" ? (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    إجمالي المدارس
                  </p>
                  <p className="text-3xl font-bold text-moe-900">
                    {stats.totalSchools}
                  </p>
                </div>
                <div className="w-12 h-12 bg-moe-100 rounded-lg flex items-center justify-center">
                  <School className="w-6 h-6 text-moe-900" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    إجمالي الحراس
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.totalGuards}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    مدارس لها حراس
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.schoolsWithGuards}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.totalSchools > 0
                      ? Math.round(
                          (stats.schoolsWithGuards / stats.totalSchools) * 100,
                        )
                      : 0}
                    % من الإجمالي
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Active Guards Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    حراس على رأس العمل
                  </p>
                  <p className="text-3xl font-bold text-moe-800">
                    {stats.activeGuards}
                  </p>
                </div>
                <div className="w-12 h-12 bg-moe-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-moe-800" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSchoolsWithoutGuards(true)}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer text-right w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    مدارس بدون حراس
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.schoolsWithoutGuards}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.totalSchools > 0
                      ? Math.round(
                          (stats.schoolsWithoutGuards / stats.totalSchools) *
                            100,
                        )
                      : 0}
                    % من الإجمالي
                  </p>
                  {stats.schoolsWithoutGuards > 0 && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      انقر لعرض التفاصيل
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </button>
          </div>

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    الحراس الذكور
                  </p>
                  <p className="text-3xl font-bold text-moe-700">
                    {stats.maleGuards}
                  </p>
                  <p className="text-xs text-gray-500">
                    {malePercentage}% من الإجمالي
                  </p>
                </div>
                <div className="w-12 h-12 bg-moe-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-moe-700" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    الحراس الإناث
                  </p>
                  <p className="text-3xl font-bold text-pink-600">
                    {stats.femaleGuards}
                  </p>
                  <p className="text-xs text-gray-500">
                    {femalePercentage}% من الإجمالي
                  </p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                إحصائيات البدل
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">يصرف بدل</span>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-bold text-green-600">
                      {stats.insuredGuards}
                    </span>
                    <span className="text-sm text-gray-500 mr-2">
                      ({insuredPercentage}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">لا يصرف بدل</span>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-bold text-red-600">
                      {stats.uninsuredGuards}
                    </span>
                    <span className="text-sm text-gray-500 mr-2">
                      ({100 - insuredPercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${insuredPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                مقارنة الجنس
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-moe-500 rounded-full"></div>
                    <span className="text-gray-700">ذكور</span>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-bold text-moe-700">
                      {stats.maleGuards}
                    </span>
                    <span className="text-sm text-gray-500 mr-2">
                      ({malePercentage}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                    <span className="text-gray-700">إناث</span>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-bold text-pink-600">
                      {stats.femaleGuards}
                    </span>
                    <span className="text-sm text-gray-500 mr-2">
                      ({femalePercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-moe-500 h-3 rounded-r-full transition-all duration-300"
                    style={{ width: `${malePercentage}%` }}
                  ></div>
                  <div
                    className="bg-pink-500 h-3 rounded-l-full transition-all duration-300 -mt-3"
                    style={{
                      width: `${femalePercentage}%`,
                      marginRight: `${malePercentage}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  التوزيع حسب المنطقة
                </h3>
              </div>
              <div className="space-y-3">
                {stats.regionStats.map((region) => (
                  <div
                    key={region.region}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-700">{region.region}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${region.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-12 text-left">
                        {region.count}
                      </span>
                      <span className="text-xs text-gray-500 w-10 text-left">
                        {region.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-moe-700" />
                <h3 className="text-lg font-semibold text-gray-800">
                  التوزيع حسب المحافظة
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.governorateStats.map((gov, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-gray-700">{gov.governorate}</span>
                      <span className="text-xs text-gray-500 mr-2">
                        ({gov.region})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-moe-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${gov.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-8 text-left">
                        {gov.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          {stats.statusStats.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-moe-800" />
                <h3 className="text-lg font-semibold text-gray-800">
                  توزيع الحراس حسب الحالة
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.statusStats.map((status) => (
                  <div
                    key={status.status}
                    className="text-center p-4 bg-gray-50 rounded-lg"
                  >
                    <p className="text-2xl font-bold text-moe-800">
                      {status.count}
                    </p>
                    <p className="text-sm text-gray-600">{status.status}</p>
                    <p className="text-xs text-gray-500">
                      {status.percentage}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* عرض الرسوم البيانية */
        <DashboardCharts stats={stats} />
      )}

      {/* Modal للمدارس بدون حراس */}
      {showSchoolsWithoutGuards && (
        <SchoolsWithoutGuardsModal
          onClose={() => setShowSchoolsWithoutGuards(false)}
        />
      )}
    </div>
  );
};
