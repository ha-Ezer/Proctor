import { useEffect, useState } from 'react';
import { adminApi, DashboardStats } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Users,
  FileText,
  Activity,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="card bg-danger-50 border-danger-200">
          <p className="text-danger-800">{error || 'Failed to load statistics'}</p>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Exams',
      value: stats.totalExams,
      icon: FileText,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: Activity,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completed Sessions',
      value: stats.completedSessions,
      icon: CheckCircle,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Flagged Sessions',
      value: stats.flaggedSessions,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your exam system performance and statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Summary */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Session Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Sessions</span>
                <span className="font-bold text-gray-900">{stats.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">In Progress</span>
                <span className="font-bold text-green-600">{stats.activeSessions}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Completed</span>
                <span className="font-bold text-teal-600">{stats.completedSessions}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Flagged for Review</span>
                <span className="font-bold text-orange-600">{stats.flaggedSessions}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="space-y-4">
              {/* Average Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Average Score</span>
                  <span className="text-sm font-bold text-gray-900">{stats.averageScore}%</span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="h-full bg-primary-600 transition-all"
                    style={{ width: `${stats.averageScore}%` }}
                  />
                </div>
              </div>

              {/* Average Violations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Average Violations</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.averageViolations} per session
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${Math.min((parseFloat(stats.averageViolations) / 7) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Completion Rate */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {stats.totalSessions > 0
                      ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
