import { useEffect, useState } from 'react';
import { adminApi, ExamDetails, ExamSnapshot } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/common/ConfirmModal';
import toast from 'react-hot-toast';
import {
  Database,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  User,
  FileText,
  CheckCircle,
  RefreshCcw,
} from 'lucide-react';

export function SnapshotsPage() {
  const [exams, setExams] = useState<ExamDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [snapshots, setSnapshots] = useState<ExamSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [error, setError] = useState('');
  const [clearConfirm, setClearConfirm] = useState<{ show: boolean; examId: string; examTitle: string }>({
    show: false,
    examId: '',
    examTitle: '',
  });
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadSnapshots();
    }
  }, [selectedExamId]);

  const loadExams = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getExams();
      setExams(response.data.data.exams);
    } catch (err) {
      setError('Failed to load exams');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSnapshots = async () => {
    if (!selectedExamId) return;

    try {
      setIsLoadingSnapshots(true);
      setError('');
      const response = await adminApi.getExamSnapshots(selectedExamId, true);
      setSnapshots(response.data.data.snapshots);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load snapshots');
      console.error(err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  const handleClearSnapshots = () => {
    const exam = exams.find((e) => e.id === selectedExamId);
    if (exam) {
      setClearConfirm({ show: true, examId: exam.id, examTitle: exam.title });
    }
  };

  const confirmClearSnapshots = async () => {
    setIsClearing(true);
    try {
      const response = await adminApi.clearExamSnapshots(clearConfirm.examId);
      toast.success(response.data.message || 'Snapshots cleared successfully');
      await loadSnapshots();
      setClearConfirm({ show: false, examId: '', examTitle: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear snapshots');
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Auto-Save Data Recovery</h1>
          </div>
          <p className="text-gray-600">
            View and manage auto-saved student responses for exam recovery purposes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-danger-50 border-danger-200 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger-600" />
              <p className="text-danger-800">{error}</p>
            </div>
          </div>
        )}

        {/* Exam Selector */}
        <div className="card mb-6">
          <label className="label mb-2">Select Exam to View Snapshots</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="input max-w-md"
          >
            <option value="">-- Select an Exam --</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.version})
              </option>
            ))}
          </select>

          {selectedExamId && (
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={loadSnapshots}
                className="btn btn-secondary flex items-center gap-2"
                disabled={isLoadingSnapshots}
              >
                <RefreshCcw className={`w-4 h-4 ${isLoadingSnapshots ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleClearSnapshots}
                className="btn btn-danger flex items-center gap-2"
                disabled={snapshots.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Clear All Snapshots
              </button>
            </div>
          )}
        </div>

        {/* Snapshots Table */}
        {selectedExamId && (
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Auto-Saved Responses</h2>
              {snapshots.length > 0 && (
                <span className="text-sm text-gray-600">
                  <strong>{snapshots.length}</strong> snapshot(s) found
                </span>
              )}
            </div>

            {isLoadingSnapshots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No snapshots found</h3>
                <p className="text-gray-600">
                  No auto-saved data for this exam. Snapshots are created when students take the exam.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Saved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Size
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {snapshots.map((snapshot) => {
                      const dataSize = new Blob([JSON.stringify(snapshot.snapshot_data)]).size;
                      return (
                        <tr key={snapshot.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {snapshot.student_name || 'Pending Name'}
                                </div>
                                <div className="text-xs text-gray-500">{snapshot.student_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {snapshot.responses_count} responses
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {snapshot.completion_percentage.toFixed(0)}% complete
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {snapshot.violations_count} violations
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {snapshot.session_status === 'completed' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                Completed
                              </span>
                            ) : snapshot.session_status === 'in_progress' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                In Progress
                              </span>
                            ) : snapshot.session_status === 'terminated' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                Terminated
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                {snapshot.session_status || 'Unknown'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatDate(snapshot.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatBytes(dataSize)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Clear Confirmation Modal */}
        <ConfirmModal
          isOpen={clearConfirm.show}
          onClose={() => setClearConfirm({ show: false, examId: '', examTitle: '' })}
          onConfirm={confirmClearSnapshots}
          title="Clear Auto-Save Snapshots"
          message={`Are you sure you want to clear all auto-save snapshots for "${clearConfirm.examTitle}"? This action cannot be undone. Students will still be able to resume their exams if they have active sessions.`}
          confirmText="Clear Snapshots"
          cancelText="Cancel"
          variant="danger"
          isLoading={isClearing}
        />
      </div>
    </AdminLayout>
  );
}
