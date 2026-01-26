import { useEffect, useState } from 'react';
import { adminApi, ExamReportData } from '@/lib/adminApi';
import { Loader2, Info } from 'lucide-react';

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
    } catch (err) {
      console.error('Failed to save cell color:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card bg-danger-50 border-danger-200">
        <p className="text-danger-800">{error || 'Failed to load exam report'}</p>
      </div>
    );
  }

  const { exam, questions, students } = data;

  if (students.length === 0) {
    return (
      <div className="card text-center py-12">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
        <p className="text-gray-600">No students have completed this exam yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="card mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h2>
        <p className="text-sm text-gray-600">
          {students.length} student{students.length !== 1 ? 's' : ''} • {questions.length} question{questions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Scrollable Table Container */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* Sticky First 3 Columns */}
              <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[150px]">
                Student Name
              </th>
              <th className="sticky left-[150px] z-20 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-300 min-w-[200px]">
                Email
              </th>
              <th
                className="sticky z-20 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-300 group relative"
                style={{ left: '350px', width: `${submissionTimeWidth}px` }}
              >
                <div className="flex items-center justify-between">
                  <span>Submission Time</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-400 bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-200 min-w-[250px] max-w-[350px]"
                  title={question.questionText}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded">
                      Q{question.questionNumber}
                    </span>
                    <span className="line-clamp-3 text-xs font-normal text-gray-700">
                      {question.questionText}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.sessionId} className="border-b border-gray-200 hover:bg-gray-50">
                {/* Sticky First 3 Columns */}
                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-gray-900 border-r border-gray-300">
                  {student.studentName}
                </td>
                <td className="sticky left-[150px] z-10 bg-white px-4 py-3 text-gray-600 border-r border-gray-300">
                  {student.studentEmail}
                </td>
                <td
                  className="sticky z-10 bg-white px-4 py-3 text-gray-600 border-r border-gray-300"
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
                      className="px-4 py-3 border-r border-gray-200"
                      style={{
                        backgroundColor: !isMultipleChoice && cellColor ? cellColor : 'white',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {/* Response Content */}
                        <div className="flex-1 min-w-0">
                          {response ? (
                            <div className="text-gray-900">
                              {/* Multiple Choice Response */}
                              {isMultipleChoice && response.responseOptionIndex !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      response.isCorrect
                                        ? 'bg-success-100 text-success-700'
                                        : 'bg-danger-100 text-danger-700'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + response.responseOptionIndex)}
                                  </span>
                                  <span className="text-xs">
                                    {response.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                  </span>
                                </div>
                              ) : (
                                /* Text/Textarea Response */
                                <div className="max-h-20 overflow-y-auto text-xs text-gray-700">
                                  {response.responseText || <span className="text-gray-400 italic">No answer</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">No response</span>
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
                                    ? 'border-gray-900 ring-1 ring-gray-500'
                                    : 'border-gray-400 hover:border-gray-600'
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

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How to use this table:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
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
          </div>
        </div>
      </div>
    </div>
  );
}
