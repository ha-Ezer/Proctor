import { useEffect, useState } from 'react';
import { adminApi, ExamDetails, ExamSnapshot } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
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
  Eye,
  X,
  Download,
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
  const [viewSnapshot, setViewSnapshot] = useState<ExamSnapshot | null>(null);
  const [questionsMap, setQuestionsMap] = useState<Map<string, { questionNumber: number; questionText: string; questionType: string; options?: Array<{ index: number; text: string; isCorrect: boolean }> }>>(new Map());

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

  const loadQuestions = async () => {
    if (!selectedExamId) return;
    
    try {
      const response = await adminApi.getExamQuestions(selectedExamId);
      const questions = response.data.data.questions || [];
      const map = new Map<string, { questionNumber: number; questionText: string; questionType: string; options?: Array<{ index: number; text: string; isCorrect: boolean }> }>();
      questions.forEach((q: any) => {
        const questionData: any = {
          questionNumber: q.questionNumber || q.question_number || 0,
          questionText: q.questionText || q.question_text || 'Question',
          questionType: q.questionType || q.question_type || 'text',
        };
        
        // Include options for multiple-choice questions
        if (questionData.questionType === 'multiple-choice' && q.options) {
          questionData.options = q.options.map((opt: any) => ({
            index: opt.option_index !== undefined ? opt.option_index : opt.index,
            text: opt.option_text || opt.text || opt.optionText,
            isCorrect: opt.is_correct !== undefined ? opt.is_correct : opt.isCorrect || false,
          }));
        }
        
        map.set(q.id, questionData);
      });
      setQuestionsMap(map);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadSnapshots();
      loadQuestions();
    }
  }, [selectedExamId]);

  // Auto-refresh snapshots every 10s when an exam is selected
  useEffect(() => {
    if (!selectedExamId) return;
    const interval = setInterval(loadSnapshots, 10000);
    return () => clearInterval(interval);
  }, [selectedExamId]);

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

  const formatDate = (dateString: string | null | undefined) => {
    if (dateString == null || dateString === '') return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
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
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Auto-Save Data Recovery</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage auto-saved student responses for exam recovery purposes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card border-destructive bg-destructive/10 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Exam Selector */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-2 max-w-md">
              <label htmlFor="snapshots-exam-select" className="text-sm font-medium text-foreground">Select Exam to View Snapshots</label>
              <select
                id="snapshots-exam-select"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="input"
                aria-label="Select exam to view snapshots"
              >
                <option value="">-- Select an Exam --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.version})
                  </option>
                ))}
              </select>
            </div>

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
          </CardContent>
        </Card>

        {/* Snapshots Table */}
        {selectedExamId && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Auto-Saved Responses</h2>
              {snapshots.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{snapshots.length}</strong> snapshot(s) found
                </span>
              )}
            </div>

            {isLoadingSnapshots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No snapshots found</h3>
                <p className="text-muted-foreground">
                  No auto-saved data for this exam. Snapshots are created when students take the exam.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Session Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Last Saved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Data Size
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {snapshots.map((snapshot) => {
                      const s = snapshot as any;
                      const rawData = s.snapshotData ?? snapshot.snapshot_data ?? {};
                      const data = typeof rawData === 'object' && rawData !== null ? rawData : {};
                      const responsesObj = data.responses && typeof data.responses === 'object' ? data.responses : {};
                      const storedResponsesCount = (Number(s.responsesCount ?? s.responses_count) || 0);
                      const derivedResponsesCount = Object.keys(responsesObj).length;
                      const responsesCount = storedResponsesCount > 0 ? storedResponsesCount : derivedResponsesCount;
                      const storedCompletion =
                        (Number(s.completionPercentage ?? s.completion_percentage) ||
                        Number(data.completionPercentage) || 0);
                      const violationsCount = (Number(s.violationsCount ?? s.violations_count) || 0);
                      const lastSaved = data.lastSaved ?? s.createdAt ?? snapshot.created_at ?? s.created_at;
                      const dataSize = new Blob([JSON.stringify(rawData)]).size;
                      const sessionStatus = s.sessionStatus ?? s.session_status ?? null;
                      const studentName = (s.studentName ?? s.student_name)?.trim() || 'Pending Name';
                      const studentEmail = (s.studentEmail ?? s.student_email) ?? '—';
                      return (
                        <tr key={snapshot.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {studentName}
                                </div>
                                <div className="text-xs text-muted-foreground">{studentEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">
                                  {responsesCount} responses
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">
                                  {Math.round(storedCompletion)}% complete
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">
                                  {violationsCount} violations
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {sessionStatus === 'completed' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-700 border border-green-500/20 rounded-full">
                                Completed
                              </span>
                            ) : sessionStatus === 'in_progress' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-700 border border-blue-500/20 rounded-full">
                                In Progress
                              </span>
                            ) : sessionStatus === 'terminated' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-700 border border-red-500/20 rounded-full">
                                Terminated
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border rounded-full">
                                {sessionStatus || 'Unknown'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {formatDate(lastSaved)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{formatBytes(dataSize)}</span>
                              <button
                                type="button"
                                onClick={() => setViewSnapshot(snapshot)}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                                title="View snapshot details"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* View Snapshot Detail Modal */}
        {viewSnapshot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">Snapshot Details</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const viewSnapData = (viewSnapshot as any).snapshotData ?? viewSnapshot.snapshot_data ?? {};
                      const responses = viewSnapData.responses || {};
                      const entries = Object.entries(responses);
                      const studentName = ((viewSnapshot as any).studentName ?? (viewSnapshot as any).student_name ?? viewSnapshot.student_name) || 'Pending Name';
                      const studentEmail = ((viewSnapshot as any).studentEmail ?? (viewSnapshot as any).student_email ?? viewSnapshot.student_email) || '—';
                      const sessionId = (viewSnapshot as any).sessionId ?? (viewSnapshot as any).session_id ?? viewSnapshot.session_id;
                      const savedDate = formatDate((viewSnapshot as any).createdAt ?? (viewSnapshot as any).created_at ?? viewSnapshot.created_at);
                      
                      // Define formatResponse function for use in this scope
                      const formatResponse = (val: any, questionId: string): { text: string; isCorrect?: boolean; correctAnswer?: string } => {
                        if (val == null || typeof val !== 'object') return { text: '—' };
                        
                        const questionInfo = questionsMap.get(questionId);
                        
                        // Handle text/textarea responses
                        if (val.responseText != null && String(val.responseText).trim() !== '') {
                          return { text: String(val.responseText).trim() };
                        }
                        
                        // Handle multiple-choice responses
                        if (val.responseOptionIndex != null && questionInfo?.questionType === 'multiple-choice' && questionInfo.options) {
                          const selectedIndex = Number(val.responseOptionIndex);
                          const selectedOption = questionInfo.options[selectedIndex];
                          const correctOption = questionInfo.options.find(opt => opt.isCorrect);
                          
                          if (selectedOption) {
                            const isCorrect = selectedOption.isCorrect || false;
                            return {
                              text: selectedOption.text || `Option ${selectedIndex + 1}`,
                              isCorrect,
                              correctAnswer: correctOption?.text,
                            };
                          }
                          return { text: `Option ${selectedIndex + 1}` };
                        }
                        
                        if (val.responseOptionIndex != null) {
                          return { text: `Option ${Number(val.responseOptionIndex) + 1}` };
                        }
                        
                        return { text: '—' };
                      };
                      
                      // Build HTML content
                      let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Snapshot Details - ${sessionId.slice(0, 8)}</title>
  <style>
    @media print {
      @page { margin: 1cm; }
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
    }
    h1 { font-size: 24px; margin-bottom: 10px; color: #1a1a1a; }
    h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    h3 { font-size: 14px; margin-top: 15px; margin-bottom: 8px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 12px;
    }
    th {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid #ddd;
      padding: 8px;
      vertical-align: top;
    }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .correct { color: #16a34a; font-weight: bold; }
    .incorrect { color: #dc2626; font-weight: bold; }
    .info-section { margin-bottom: 20px; }
    .info-row { margin: 5px 0; }
    .question-text { white-space: normal; word-wrap: break-word; max-width: 400px; }
    .response-text { white-space: pre-wrap; word-wrap: break-word; max-width: 250px; }
  </style>
</head>
<body>
  <h1>Snapshot Details</h1>
  
  <div class="info-section">
    <h3>Student Information</h3>
    <div class="info-row"><strong>Name:</strong> ${studentName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div class="info-row"><strong>Email:</strong> ${studentEmail.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
  
  <div class="info-section">
    <h3>Session Information</h3>
    <div class="info-row"><strong>Session ID:</strong> ${sessionId}</div>
    <div class="info-row"><strong>Saved:</strong> ${savedDate}</div>
  </div>
  
  <h2>Questions & Responses</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 60px;">#</th>
        <th style="width: 400px;">Question</th>
        <th style="width: 250px;">Student Response</th>
        <th style="width: 200px;">Correct Answer</th>
      </tr>
    </thead>
    <tbody>`;
                      
                      entries.forEach(([questionId, val]: [string, any]) => {
                        const questionInfo = questionsMap.get(questionId);
                        const questionNumber = questionInfo?.questionNumber || 0;
                        const questionText = (questionInfo?.questionText || 'Question not found').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                        const response = formatResponse(val, questionId);
                        
                        let studentResponseHtml = response.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                        let responseClass = '';
                        if (response.isCorrect === true) {
                          studentResponseHtml = `✓ ${studentResponseHtml}`;
                          responseClass = 'correct';
                        } else if (response.isCorrect === false) {
                          studentResponseHtml = `✗ ${studentResponseHtml}`;
                          responseClass = 'incorrect';
                        }
                        
                        const correctAnswerHtml = response.correctAnswer 
                          ? response.correctAnswer.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
                          : (questionInfo?.questionType === 'multiple-choice' ? '—' : 'N/A');
                        
                        htmlContent += `
      <tr>
        <td><strong>Q${questionNumber}</strong></td>
        <td class="question-text">${questionText}</td>
        <td class="response-text ${responseClass}">${studentResponseHtml}</td>
        <td>${correctAnswerHtml}</td>
      </tr>`;
                      });
                      
                      htmlContent += `
    </tbody>
  </table>
</body>
</html>`;
                      
                      // Create a temporary container for printing
                      const printContainer = document.createElement('div');
                      printContainer.id = 'snapshot-print-container';
                      printContainer.innerHTML = htmlContent;
                      printContainer.style.position = 'absolute';
                      printContainer.style.left = '-9999px';
                      printContainer.style.top = '0';
                      printContainer.style.width = '210mm'; // A4 width
                      printContainer.style.padding = '20mm';
                      printContainer.style.backgroundColor = 'white';
                      printContainer.style.color = 'black';
                      printContainer.style.fontFamily = 'Arial, sans-serif';
                      
                      // Add print-specific styles
                      const style = document.createElement('style');
                      style.id = 'snapshot-print-styles';
                      style.textContent = `
                        @media print {
                          @page { margin: 1cm; size: A4; }
                          body * { visibility: hidden; }
                          #snapshot-print-container, #snapshot-print-container * { visibility: visible; }
                          #snapshot-print-container { position: absolute; left: 0; top: 0; width: 100%; }
                        }
                        @media screen {
                          #snapshot-print-container {
                            position: absolute;
                            left: -9999px;
                            width: 210mm;
                            padding: 20mm;
                            background: white;
                            color: black;
                          }
                        }
                      `;
                      
                      document.head.appendChild(style);
                      document.body.appendChild(printContainer);
                      
                      // Wait a moment for rendering, then print
                      setTimeout(() => {
                        window.print();
                        toast.success('PDF export initiated');
                        
                        // Clean up after printing
                        setTimeout(() => {
                          document.body.removeChild(printContainer);
                          const existingStyle = document.getElementById('snapshot-print-styles');
                          if (existingStyle) {
                            document.head.removeChild(existingStyle);
                          }
                        }, 1000);
                      }, 100);
                    }}
                    className="text-primary-600 hover:text-primary-700 p-2 transition-colors flex items-center gap-2"
                    title="Export to PDF"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm font-medium">Export PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewSnapshot(null)}
                    className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Student</h4>
                  <p className="text-foreground font-medium">{((viewSnapshot as any).studentName ?? (viewSnapshot as any).student_name ?? viewSnapshot.student_name) || 'Pending Name'}</p>
                  <p className="text-sm text-muted-foreground">{((viewSnapshot as any).studentEmail ?? (viewSnapshot as any).student_email ?? viewSnapshot.student_email) || '—'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Session</h4>
                  <p className="text-sm font-mono text-foreground">{(viewSnapshot as any).sessionId ?? (viewSnapshot as any).session_id ?? viewSnapshot.session_id}</p>
                  <p className="text-sm text-muted-foreground mt-1">Saved: {formatDate((viewSnapshot as any).createdAt ?? (viewSnapshot as any).created_at ?? viewSnapshot.created_at)}</p>
                </div>
                {(() => {
                  const viewSnapData = (viewSnapshot as any).snapshotData ?? viewSnapshot.snapshot_data ?? {};
                  if (!viewSnapData || typeof viewSnapData !== 'object') return null;
                  const responses = viewSnapData.responses;
                  const entries = responses && typeof responses === 'object' ? Object.entries(responses) : [];
                  const formatResponse = (val: any, questionId: string): { text: string; isCorrect?: boolean; correctAnswer?: string } => {
                    if (val == null || typeof val !== 'object') return { text: '—' };
                    
                    const questionInfo = questionsMap.get(questionId);
                    
                    // Handle text/textarea responses
                    if (val.responseText != null && String(val.responseText).trim() !== '') {
                      return { text: String(val.responseText).trim() };
                    }
                    
                    // Handle multiple-choice responses
                    if (val.responseOptionIndex != null && questionInfo?.questionType === 'multiple-choice' && questionInfo.options) {
                      const selectedIndex = Number(val.responseOptionIndex);
                      const selectedOption = questionInfo.options[selectedIndex];
                      const correctOption = questionInfo.options.find(opt => opt.isCorrect);
                      
                      if (selectedOption) {
                        const isCorrect = selectedOption.isCorrect || false;
                        return {
                          text: selectedOption.text || `Option ${selectedIndex + 1}`,
                          isCorrect,
                          correctAnswer: correctOption?.text,
                        };
                      }
                      return { text: `Option ${selectedIndex + 1}` };
                    }
                    
                    if (val.responseOptionIndex != null) {
                      return { text: `Option ${Number(val.responseOptionIndex) + 1}` };
                    }
                    
                    return { text: '—' };
                  };
                  return (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Questions & Responses</h4>
                        {entries.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No responses saved yet.</p>
                        ) : (
                          <div className="overflow-x-auto border border-border rounded-lg">
                            <table className="w-full text-sm">
                              <thead className="bg-muted border-b border-border">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium text-foreground w-16">#</th>
                                  <th className="px-4 py-2 text-left font-medium text-foreground min-w-[300px]">Question</th>
                                  <th className="px-4 py-2 text-left font-medium text-foreground min-w-[200px]">Student Response</th>
                                  <th className="px-4 py-2 text-left font-medium text-foreground min-w-[150px]">Correct Answer</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {entries.map(([questionId, val], index) => {
                                  const questionInfo = questionsMap.get(questionId);
                                  const questionText = questionInfo?.questionText || 'Question not found';
                                  const questionNumber = questionInfo?.questionNumber || index + 1;
                                  const response = formatResponse(val, questionId);
                                  
                                  return (
                                    <tr key={questionId} className="hover:bg-muted/50">
                                      <td className="px-4 py-3 font-medium text-foreground">Q{questionNumber}</td>
                                      <td className="px-4 py-3 text-foreground">
                                        <div className="min-w-[300px]">
                                          <p className="font-medium text-foreground whitespace-normal">{questionText}</p>
                                          <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {questionId.slice(0, 8)}…</p>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-foreground whitespace-pre-wrap min-w-[200px]">
                                        <div className="flex items-center gap-2">
                                          <span className={response.isCorrect === true ? 'text-green-600 font-semibold' : response.isCorrect === false ? 'text-red-600 font-semibold' : ''}>
                                            {response.text}
                                          </span>
                                          {response.isCorrect === true && (
                                            <span title="Correct answer">
                                              <CheckCircle className="w-4 h-4 text-green-600" />
                                            </span>
                                          )}
                                          {response.isCorrect === false && (
                                            <span title="Incorrect answer">
                                              <AlertCircle className="w-4 h-4 text-red-600" />
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-foreground min-w-[150px]">
                                        {response.correctAnswer ? (
                                          <span className="text-green-700 font-medium">{response.correctAnswer}</span>
                                        ) : questionInfo?.questionType === 'multiple-choice' ? (
                                          <span className="text-muted-foreground">—</span>
                                        ) : (
                                          <span className="text-muted-foreground">N/A</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Metadata</h4>
                        <ul className="text-sm text-foreground space-y-1">
                          <li>Completion: {Number(viewSnapData.completionPercentage ?? (viewSnapshot as any).completionPercentage ?? viewSnapshot.completion_percentage ?? 0)}%</li>
                          <li>Current question index: {viewSnapData.currentQuestionIndex ?? '—'}</li>
                          <li>Last saved (in payload): {formatDate(viewSnapData.lastSaved)}</li>
                          <li>Violations count: {Number((viewSnapshot as any).violationsCount ?? (viewSnapshot as any).violations_count ?? viewSnapshot.violations_count ?? 0)}</li>
                        </ul>
                      </div>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-primary font-medium">Raw snapshot data (JSON)</summary>
                        <pre className="mt-2 p-3 bg-muted rounded overflow-x-auto text-xs max-h-48 overflow-y-auto text-foreground">
                          {JSON.stringify(viewSnapData, null, 2)}
                        </pre>
                      </details>
                    </>
                  );
                })()}
              </div>
              <div className="p-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => setViewSnapshot(null)}
                  className="btn btn-secondary w-full sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
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
