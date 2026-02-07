import { useEffect, useState } from 'react';
import { adminApi, ExamDetails } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExamReportTable } from '@/components/admin/ExamReportTable';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table2 } from 'lucide-react';

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
      const allExams = response.data.data.exams;
      setExams(allExams);

      // Auto-select first exam if available
      if (allExams.length > 0 && !selectedExamId) {
        setSelectedExamId(allExams[0].id);
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full max-w-md" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Exam Reports</h1>
          <p className="text-muted-foreground">View detailed reports for all students who completed an exam</p>
        </div>

        {/* Exam Selector */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Table2 className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Select Exam</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="exam-select">Exam</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger id="exam-select">
                  <SelectValue placeholder="Select an exam..." />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title} ({exam.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exam Report Table */}
        {selectedExamId ? (
          <ExamReportTable examId={selectedExamId} />
        ) : (
          <EmptyState
            icon={Table2}
            title="Select an Exam"
            description="Choose an exam from the dropdown above to view the report"
          />
        )}
      </div>
    </AdminLayout>
  );
}
