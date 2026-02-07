import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi, SessionDetailData } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/common/ConfirmModal';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Loader2,
  Save,
  X as XIcon,
  Download,
} from 'lucide-react';

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState(false);
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<{ show: boolean; questionId: string }>({
    show: false,
    questionId: '',
  });
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    loadSessionDetails();
  }, [sessionId]);

  const loadSessionDetails = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getSessionDetails(sessionId!);
      console.log('[SessionDetailPage] API Response:', response.data);
      console.log('[SessionDetailPage] Session Data:', response.data.data);
      setData(response.data.data);
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError('Failed to load session details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNote = (questionId: string, currentNote: string | null) => {
    setEditingNoteId(questionId);
    setNoteText(currentNote || '');
  };

  const handleSaveNote = async (questionId: string) => {
    if (!sessionId) return;

    try {
      setSavingNote(true);
      await adminApi.saveSessionQuestionNote(sessionId, questionId, noteText);

      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          responses: prev.responses.map((r) =>
            r.questionId === questionId ? { ...r, note: noteText } : r
          ),
        };
      });

      setEditingNoteId(null);
      setNoteText('');
      toast.success('Note saved successfully');
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleDeleteNote = (questionId: string) => {
    setDeleteNoteConfirm({ show: true, questionId });
  };

  const confirmDeleteNote = async () => {
    if (!sessionId) return;

    setIsDeletingNote(true);
    try {
      await adminApi.deleteSessionQuestionNote(sessionId, deleteNoteConfirm.questionId);

      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          responses: prev.responses.map((r) =>
            r.questionId === deleteNoteConfirm.questionId ? { ...r, note: null } : r
          ),
        };
      });

      toast.success('Note deleted successfully');
      setDeleteNoteConfirm({ show: false, questionId: '' });
    } catch (err) {
      console.error('Failed to delete note:', err);
      toast.error('Failed to delete note');
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="card border-destructive bg-destructive/10">
          <p className="text-destructive">{error || 'Session not found'}</p>
        </div>
      </AdminLayout>
    );
  }

  const { session, responses, violations } = data;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/admin/sessions" className="text-primary hover:text-primary/80 font-medium">
            Sessions
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Session Details</span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/sessions')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Sessions</span>
        </button>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Session Details</h1>
            <p className="text-muted-foreground">{session.examTitle}</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export as PDF
          </button>
        </div>

        {/* Session Info Card */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Session Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground font-medium">Student</label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{session.studentName}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{session.studentId}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-medium">Status</label>
              <div className="mt-1">
                {session.status === 'completed' && (
                  <span className="flex items-center gap-1 text-success-600">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </span>
                )}
                {session.status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Clock className="w-4 h-4" />
                    In Progress
                  </span>
                )}
                {session.status === 'terminated' && (
                  <span className="flex items-center gap-1 text-danger-600">
                    <XCircle className="w-4 h-4" />
                    Terminated
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-medium">Start Time</label>
              <p className="text-foreground mt-1">{new Date(session.startTime).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-medium">Violations</label>
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle
                  className={`w-4 h-4 ${session.totalViolations > 3 ? 'text-orange-600' : 'text-muted-foreground'}`}
                />
                <span className={`font-medium ${session.totalViolations > 3 ? 'text-orange-600' : 'text-foreground'}`}>
                  {session.totalViolations}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions and Responses - Side by Side */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Questions & Responses</h2>

          {responses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No responses recorded for this session</p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((response, index) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <div className="grid md:grid-cols-2 divide-x divide-border">
                  {/* Left: Question */}
                  <div className="p-6 bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
                        Q{response.questionNumber}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{response.questionType}</span>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-3">{response.questionText}</h3>

                    {/* Multiple Choice Options */}
                    {response.questionType === 'multiple-choice' && response.options && (
                      <div className="space-y-2 mt-4">
                        {response.options.map((option, optIndex) => {
                          const isSelected = response.selectedOptionIndex === optIndex;
                          const isCorrect = option === response.correctAnswer;

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border ${
                                isSelected && isCorrect
                                  ? 'bg-success-50 border-success-300'
                                  : isSelected && !isCorrect
                                  ? 'bg-danger-50 border-danger-300'
                                  : isCorrect
                                  ? 'bg-success-50 border-success-200'
                                  : 'bg-card border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span className="flex-1">{option}</span>
                                {isCorrect && (
                                  <CheckCircle className="w-5 h-5 text-success-600" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Student Response */}
                  <div className="p-6 bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">Student Response</h4>
                      {response.answeredAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(response.answeredAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {/* Multiple Choice Response */}
                    {response.questionType === 'multiple-choice' && (
                      <div>
                        {response.selectedOption ? (
                          <div className="space-y-3">
                            <div
                              className={`p-4 rounded-lg ${
                                response.isCorrect
                                  ? 'bg-success-100 border-2 border-success-500'
                                  : 'bg-danger-100 border-2 border-danger-500'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {response.isCorrect ? (
                                  <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-foreground mb-1">
                                    {response.selectedOption}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {response.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {!response.isCorrect && response.correctAnswer && (
                              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Correct Answer:</p>
                                <p className="text-sm font-medium text-foreground">{response.correctAnswer}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                            No response provided
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text/Textarea Response */}
                    {(response.questionType === 'text' || response.questionType === 'textarea') && (
                      <div>
                        {response.responseText ? (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <p className="text-foreground whitespace-pre-wrap">{response.responseText}</p>
                          </div>
                        ) : (
                          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                            No response provided
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin Note */}
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-foreground uppercase">Admin Note</label>
                        {!editingNoteId && response.note && (
                          <button
                            onClick={() => handleDeleteNote(response.questionId)}
                            className="text-xs text-danger-600 hover:text-danger-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {editingNoteId === response.questionId ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="input min-h-[80px]"
                            placeholder="Add a note about this response..."
                            disabled={savingNote}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveNote(response.questionId)}
                              disabled={savingNote}
                              className="btn-primary text-sm flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              {savingNote ? 'Saving...' : 'Save Note'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={savingNote}
                              className="btn-secondary text-sm flex items-center gap-1"
                            >
                              <XIcon className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {response.note ? (
                            <div
                              onClick={() => handleEditNote(response.questionId, response.note || null)}
                              className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors"
                            >
                              <p className="text-sm text-foreground whitespace-pre-wrap">{response.note}</p>
                              <p className="text-xs text-blue-600 mt-2">Click to edit</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditNote(response.questionId, null)}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              + Add Note
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Violations */}
        {violations.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-foreground mb-4">Violations Log</h2>
            <div className="space-y-3">
              {violations.map((violation, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    violation.severity === 'high' || violation.severity === 'critical'
                      ? 'bg-destructive/10 border-destructive/20'
                      : violation.severity === 'medium'
                      ? 'bg-orange-500/10 border-orange-500/20'
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            violation.severity === 'high' || violation.severity === 'critical'
                              ? 'text-destructive'
                              : violation.severity === 'medium'
                              ? 'text-orange-600'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <span className="font-semibold text-foreground">{violation.violationType}</span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            violation.severity === 'high' || violation.severity === 'critical'
                              ? 'bg-danger-200 text-danger-800'
                              : violation.severity === 'medium'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {violation.severity}
                        </span>
                      </div>
                      {violation.description && (
                        <p className="text-sm text-muted-foreground">{violation.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(violation.detectedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Note Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteNoteConfirm.show}
          onClose={() => setDeleteNoteConfirm({ show: false, questionId: '' })}
          onConfirm={confirmDeleteNote}
          title="Delete Note"
          message="Are you sure you want to delete this note? This action cannot be undone."
          confirmText="Delete Note"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeletingNote}
        />
      </div>
    </AdminLayout>
  );
}
