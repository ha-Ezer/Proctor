import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, SessionDetails, ExamDetails } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExamReportTable } from '@/components/admin/ExamReportTable';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  User,
  XCircle,
  Filter,
  X,
  List,
  Table2,
} from 'lucide-react';

export function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionDetails[]>([]);
  const [exams, setExams] = useState<ExamDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'report'>('list');

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [filter, selectedExamId, startDate, endDate]);

  const loadExams = async () => {
    try {
      const response = await adminApi.getExams();
      setExams(response.data.data.exams);
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const params: any = {};

      if (filter !== 'all') {
        params.status = filter;
      }

      if (selectedExamId) {
        params.examId = selectedExamId;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await adminApi.getSessions(params);
      setSessions(response.data.data.sessions);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setSelectedExamId('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = filter !== 'all' || selectedExamId || startDate || endDate;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1 w-fit">
            <Activity className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'terminated':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Terminated
          </span>
        );
      default:
        return null;
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Monitoring</h1>
          <p className="text-gray-600">Monitor all exam sessions and proctoring activity</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm text-white bg-danger-600 hover:bg-danger-700 font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                All Sessions
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'in_progress'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Exam and Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Exam Filter */}
            <div>
              <label htmlFor="exam-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name
              </label>
              <select
                id="exam-filter"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="input"
              >
                <option value="">All Exams</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.version})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="input"
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filter !== 'all' && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    Status: {filter.replace('_', ' ')}
                  </span>
                )}
                {selectedExamId && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    Exam: {exams.find((e) => e.id === selectedExamId)?.title || 'Unknown'}
                  </span>
                )}
                {startDate && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    From: {new Date(startDate).toLocaleDateString()}
                  </span>
                )}
                {endDate && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    To: {new Date(endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-danger-50 border-danger-200 mb-6">
            <p className="text-danger-800">{error}</p>
          </div>
        )}

        {/* Tabs - Show when exam is selected */}
        {selectedExamId && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-3 font-medium text-sm transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                  activeTab === 'list'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                Session List
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-6 py-3 font-medium text-sm transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                  activeTab === 'report'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Table2 className="w-4 h-4" />
                Exam Report
              </button>
            </div>
          </div>
        )}

        {/* Conditional Content Based on Active Tab */}
        {activeTab === 'report' && selectedExamId ? (
          <ExamReportTable examId={selectedExamId} />
        ) : (
          /* Sessions List */
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => navigate(`/admin/sessions/${session.id}`)}
              className="card hover:shadow-lg transition-shadow cursor-pointer hover:border-primary-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Session Info */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{session.examTitle}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{session.studentName}</span>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Started: {new Date(session.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className={session.totalViolations > 3 ? 'text-orange-600 font-medium' : ''}>
                        {session.totalViolations} violations
                      </span>
                    </div>
                    {session.score !== undefined && session.score !== null && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Score: {session.score}%</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {session.status === 'in_progress' && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{session.completionPercentage}%</span>
                      </div>
                      <div className="progress-bar h-2">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{ width: `${session.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info Card */}
                <div className="lg:w-48 bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session ID:</span>
                    <span className="font-mono text-xs text-gray-900">{session.sessionId.slice(0, 12)}...</span>
                  </div>
                  {session.wasResumed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resumed:</span>
                      <span className="font-medium text-orange-600">{session.resumeCount}x</span>
                    </div>
                  )}
                  {session.submissionType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="text-gray-900 capitalize">{session.submissionType.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sessions.length === 0 && !error && (
            <div className="card text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'No exam sessions have been started yet'
                  : `No ${filter.replace('_', ' ')} sessions`}
              </p>
            </div>
          )}

          {/* Summary */}
          {sessions.length > 0 && (
            <div className="mt-6 text-sm text-gray-600">
              Showing <strong>{sessions.length}</strong> session{sessions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        )}
      </div>
    </AdminLayout>
  );
}
