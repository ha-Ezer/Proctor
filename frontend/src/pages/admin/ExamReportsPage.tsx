import { useEffect, useState } from 'react';
import { adminApi, ExamDetails } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExamReportTable } from '@/components/admin/ExamReportTable';
import { Loader2, Table2 } from 'lucide-react';

export function ExamReportsPage() {
  const [exams, setExams] = useState<ExamDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getExams();
      const activeExams = response.data.data.exams.filter((exam) => exam.isActive);
      setExams(activeExams);

      // Auto-select first exam if available
      if (activeExams.length > 0 && !selectedExamId) {
        setSelectedExamId(activeExams[0].id);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Reports</h1>
          <p className="text-gray-600">View detailed reports for all students who completed an exam</p>
        </div>

        {/* Exam Selector */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Table2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Select Exam</h2>
          </div>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="input max-w-md"
          >
            <option value="">Select an exam...</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.version})
              </option>
            ))}
          </select>
        </div>

        {/* Exam Report Table */}
        {selectedExamId ? (
          <ExamReportTable examId={selectedExamId} />
        ) : (
          <div className="card text-center py-12">
            <Table2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Exam</h3>
            <p className="text-gray-600">Choose an exam from the dropdown above to view the report</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
