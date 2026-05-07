import React from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { DashboardStats } from '../types';
import {
  Users,
  School,
  Shield,
  MapPin,
  Building,
  TrendingUp
} from 'lucide-react';

interface DashboardChartsProps {
  stats: DashboardStats;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ stats }) => {

  const COLORS = {
    gender: ['#1D7587', '#EC4899'],
    insurance: ['#3BAA72', '#EF4444'],
    schools: ['#3BAA72', '#F59E0B'],
    regions: ['#155560', '#1D7587', '#3BAA72', '#2D9A62'],
    status: ['#3BAA72', '#EF4444', '#F59E0B', '#6B7280']
  };

  const genderData = [
    { name: 'ذكور', value: stats.maleGuards },
    { name: 'إناث', value: stats.femaleGuards }
  ];

  const insuranceData = [
    { name: 'مؤمن', value: stats.insuredGuards },
    { name: 'غير مؤمن', value: stats.uninsuredGuards }
  ];

  const schoolsData = [
    { name: 'لها حراس', value: stats.schoolsWithGuards },
    { name: 'بدون حراس', value: stats.schoolsWithoutGuards }
  ];

  const regionData = stats.regionStats.map((r) => ({
    name: r.region,
    مدارس: r.count
  }));

  const statusData = stats.statusStats.map((s) => ({
    name: s.status,
    عدد: s.count
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow border text-sm">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-gray-600">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const Card = ({ title, icon, children }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* كروت سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="إجمالي المدارس" icon={<School className="text-moe-600" />}>
          <p className="text-2xl font-bold text-moe-600 text-center">{stats.totalSchools}</p>
        </Card>

        <Card title="إجمالي الحراس" icon={<Users className="text-green-600" />}>
          <p className="text-2xl font-bold text-green-600 text-center">{stats.totalGuards}</p>
        </Card>

        <Card title="مؤمن عليهم" icon={<Shield className="text-moe-700" />}>
          <p className="text-2xl font-bold text-moe-700 text-center">{stats.insuredGuards}</p>
        </Card>

        <Card title="مدارس لها حراس" icon={<Building className="text-orange-600" />}>
          <p className="text-2xl font-bold text-orange-600 text-center">{stats.schoolsWithGuards}</p>
        </Card>
      </div>

      {/* الدوائر */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* الجنس */}
        <Card title="توزيع الجنس" icon={<Users className="text-moe-600" />}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={genderData} dataKey="value" innerRadius={60} outerRadius={90}>
                {genderData.map((_, i) => (
                  <Cell key={i} fill={COLORS.gender[i]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* البدل */}
        <Card title="حالة البدل" icon={<Shield className="text-green-600" />}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={insuranceData} dataKey="value" innerRadius={60} outerRadius={90}>
                {insuranceData.map((_, i) => (
                  <Cell key={i} fill={COLORS.insurance[i]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* التغطية */}
        <Card title="تغطية المدارس" icon={<School className="text-orange-600" />}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={schoolsData} dataKey="value" innerRadius={60} outerRadius={90}>
                {schoolsData.map((_, i) => (
                  <Cell key={i} fill={COLORS.schools[i]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* الأعمدة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* المناطق */}
        <Card title="المدارس حسب المنطقة" icon={<MapPin className="text-moe-600" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="مدارس" fill="#1D7587" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* الحالة */}
        {stats.statusStats.length > 0 && (
          <Card title="الحراس حسب الحالة" icon={<TrendingUp className="text-moe-700" />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="عدد" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* المحافظات */}
      {stats.governorateStats.length > 0 && (
        <Card title="توزيع المدارس حسب المحافظة" icon={<Building className="text-green-600" />}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={stats.governorateStats.map(g => ({
                name: g.governorate,
                مدارس: g.count
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="مدارس" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

    </div>
  );
};