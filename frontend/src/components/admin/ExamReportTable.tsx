import { useEffect, useState } from 'react';
import { adminApi, ExamReportData } from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Info } from 'lucide-react';

interface ExamReportTableProps {
  examId: string;
}

const COLOR_OPTIONS = [
  { name: 'Red', value: '#FEE2E2' },      // Light red background
  { name: 'Yellow', value: '#FEF3C7' },   // Light yellow background
  { name: 'Orange', value: '#FED7AA' },   // Light orange background
  { name: 'Green', value: '#D1FAE5' },    // Light green background
];

export function ExamReportTable({ examId }: ExamReportTableProps) {
  const [data, setData] = useState<ExamReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionTimeWidth, setSubmissionTimeWidth] = useState(200); // Default width in pixels

  useEffect(() => {
    loadExamReport();
  }, [examId]);

  const loadExamReport = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getExamReport(examId);
      setData(response.data.data);
    } catch (err: any) {
      console.error('Failed to load exam report:', err);
      setError(err.response?.data?.message || 'Failed to load exam report');
    } finally {
      setIsLoading(false);
    }
  };

  const getCellColor = (sessionId: string, questionId: string): string => {
    if (!data) return '';
    const colorEntry = data.colors.find(
      (c) => c.sessionId === sessionId && c.questionId === questionId
    );
    return colorEntry?.color || '';
  };

  const handleColorSelect = async (
    sessionId: string,
    questionId: string,
    color: string
  ) => {
    const currentColor = getCellColor(sessionId, questionId);

    try {
      if (color === currentColor) {
        // Remove color if clicking the same one
        await adminApi.deleteExamReportCellColor(examId, sessionId, questionId);

        // Update local state
        setData((prev) => {
          if (!prev) return prev;
          const newColors = prev.colors.filter(
            (c) => !(c.sessionId === sessionId && c.questionId === questionId)
          );
          return { ...prev, colors: newColors };
        });
      } else {
        // Save new color
        await adminApi.saveExamReportCellColor(examId, sessionId, questionId, color);

        // Update local state
        setData((prev) => {
          if (!prev) return prev;
          const newColors = prev.colors.filter(
            (c) => !(c.sessionId === sessionId && c.questionId === questionId)
          );
          newColors.push({ sessionId, questionId, color });
          return { ...prev, colors: newColors };
        });
      }
    } catch (err: any) {
      console.error('Failed to save cell color:', err);
      const message = err.response?.data?.message || 'Failed to save cell color';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Failed to load exam report'}</AlertDescription>
      </Alert>
    );
  }

  const { exam, questions, students } = data;

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Info}
        title="No Submissions Yet"
        description="No students have completed this exam yet."
      />
    );
  }

  return (
    <div className="relative">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl">{exam.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {students.length} student{students.length !== 1 ? 's' : ''} • {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
      </Card>

      {/* Scrollable Table Container */}
      <Card className="overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border">
                {/* Sticky First 3 Columns */}
                <th className="sticky left-0 z-20 bg-muted px-4 py-3 text-left font-semibold text-foreground border-r border-border min-w-[150px]">
                  Student Name
                </th>
                <th className="sticky left-[150px] z-20 bg-muted px-4 py-3 text-left font-semibold text-foreground border-r border-border min-w-[200px]">
                  Email
                </th>
                <th
                  className="sticky z-20 bg-muted px-4 py-3 text-left font-semibold text-foreground border-r border-border group relative"
                  style={{ left: '350px', width: `${submissionTimeWidth}px` }}
                >
                  <div className="flex items-center justify-between">
                    <span>Submission Time</span>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary bg-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.clientX;
                        const startWidth = submissionTimeWidth;

                        const handleMouseMove = (e: MouseEvent) => {
                          const diff = e.clientX - startX;
                          const newWidth = Math.max(150, Math.min(400, startWidth + diff));
                          setSubmissionTimeWidth(newWidth);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  </div>
                </th>

                {/* Question Columns */}
                {questions.map((question) => (
                  <th
                    key={question.id}
                    className="px-4 py-3 text-left font-semibold text-foreground border-r border-border min-w-[250px] max-w-[350px]"
                    title={question.questionText}
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="flex-shrink-0">
                        Q{question.questionNumber}
                      </Badge>
                      <span className="line-clamp-3 text-xs font-normal text-muted-foreground">
                        {question.questionText}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.sessionId} className="border-b border-border hover:bg-muted/50">
                  {/* Sticky First 3 Columns */}
                  <td className="sticky left-0 z-10 bg-background px-4 py-3 font-medium text-foreground border-r border-border">
                    {student.studentName}
                  </td>
                  <td className="sticky left-[150px] z-10 bg-background px-4 py-3 text-muted-foreground border-r border-border">
                    {student.studentEmail}
                  </td>
                  <td
                    className="sticky z-10 bg-background px-4 py-3 text-muted-foreground border-r border-border"
                    style={{ left: '350px', width: `${submissionTimeWidth}px` }}
                  >
                    {new Date(student.submissionTime).toLocaleString()}
                  </td>

                  {/* Response Columns */}
                  {questions.map((question, qIndex) => {
                    const response = student.responses[qIndex];
                    const cellColor = getCellColor(student.sessionId, question.id);
                    const isMultipleChoice = question.questionType === 'multiple-choice';

                    return (
                      <td
                        key={`${student.sessionId}-${question.id}`}
                        className="px-4 py-3 border-r border-border"
                        style={{
                          backgroundColor: !isMultipleChoice && cellColor ? cellColor : undefined,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {/* Response Content */}
                          <div className="flex-1 min-w-0">
                            {response ? (
                              <div className="text-foreground">
                                {/* Multiple Choice Response */}
                                {isMultipleChoice && response.responseOptionIndex !== undefined ? (
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={response.isCorrect ? 'default' : 'destructive'}
                                      className={response.isCorrect ? 'bg-green-500 hover:bg-green-600' : ''}
                                    >
                                      {String.fromCharCode(65 + response.responseOptionIndex)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {response.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </span>
                                  </div>
                                ) : (
                                  /* Text/Textarea Response */
                                  <div className="max-h-20 overflow-y-auto text-xs text-muted-foreground custom-scrollbar">
                                    {response.responseText || <span className="text-muted-foreground/70 italic">No answer</span>}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/70 text-xs italic">No response</span>
                            )}
                          </div>

                          {/* Color Markers - Only for text/textarea, vertically stacked */}
                          {!isMultipleChoice && (
                            <div className="flex-shrink-0 flex flex-col gap-1">
                              {COLOR_OPTIONS.map((colorOption) => (
                                <button
                                  key={colorOption.value}
                                  onClick={() => handleColorSelect(student.sessionId, question.id, colorOption.value)}
                                  className={`w-4 h-4 rounded border transition-all hover:scale-125 ${
                                    cellColor === colorOption.value
                                      ? 'border-foreground ring-1 ring-foreground/50'
                                      : 'border-border hover:border-foreground/50'
                                  }`}
                                  style={{
                                    backgroundColor: colorOption.value,
                                  }}
                                  title={`${colorOption.name}${cellColor === colorOption.value ? ' (selected)' : ''}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Instructions */}
      <Alert className="mt-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">How to use this table:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Click any color marker (vertical stack on right) to color-code text/textarea responses</li>
            <li>Selected color fills the entire cell background</li>
            <li>Click the same color again to remove it</li>
            <li>Multiple-choice questions don't have color markers (correct/incorrect is already indicated)</li>
            <li>Colors are saved automatically and visible to all admins</li>
            <li>The first 3 columns (Name, Email, Submission Time) stay fixed when scrolling</li>
            <li>Hover over question headers to see the full question text</li>
            <li>
              <strong>Color meanings:</strong> Red (needs attention), Yellow (review), Orange (partial), Green (good)
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
