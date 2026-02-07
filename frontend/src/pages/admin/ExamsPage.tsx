import { useEffect, useState } from 'react';
import { adminApi, ExamDetails, CreateExamData, AddQuestionData, StudentGroup } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExamEditor } from '@/components/admin/ExamEditor';
import ConfirmModal from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import {
  Plus,
  FileText,
  Clock,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Copy,
  UsersRound,
  CheckSquare,
  Square,
} from 'lucide-react';

export function ExamsPage() {
  const [exams, setExams] = useState<ExamDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; exam: ExamDetails | null }>({
    show: false,
    exam: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingExamId, setDuplicatingExamId] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

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

  const handleActivateExam = async (examId: string, isActive: boolean) => {
    try {
      await adminApi.activateExam(examId, isActive);
      await loadExams();
      toast.success(isActive ? 'Exam activated successfully' : 'Exam deactivated successfully');
    } catch (err) {
      toast.error('Failed to update exam status');
      console.error(err);
    }
  };

  const handleDeleteExam = (exam: ExamDetails) => {
    setDeleteConfirm({ show: true, exam });
  };

  const handleDuplicateExam = async (exam: ExamDetails) => {
    setDuplicatingExamId(exam.id);
    try {
      const createRes = await adminApi.createExam({
        title: `${exam.title} (Copy)`,
        description: exam.description,
        version: exam.version || 'v1.0',
        durationMinutes: exam.durationMinutes,
        maxViolations: exam.maxViolations,
      });
      const newExam = createRes.data.data;

      await adminApi.updateExam(newExam.id, {
        enableFullscreen: exam.enableFullscreen,
        autoSaveIntervalSeconds: exam.autoSaveIntervalSeconds,
        warningAtMinutes: exam.warningAtMinutes,
        minTimeGuaranteeMinutes: exam.minTimeGuaranteeMinutes,
        useGroupAccess: exam.useGroupAccess,
      });

      const questionsRes = await adminApi.getExamQuestions(exam.id);
      const questions = questionsRes.data.data?.questions ?? [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionText = (q.questionText ?? q.question_text ?? '').toString().trim();
        if (!questionText) continue;
        
        const opts = q.options ?? [];
        const isMultipleChoice = (q.questionType ?? q.question_type) === 'multiple-choice';
        
        // Build payload matching AddQuestionData interface
        const payload: AddQuestionData = {
          examId: newExam.id,
          questionNumber: q.questionNumber ?? q.question_number ?? i + 1,
          questionText,
          questionType: (q.questionType ?? q.question_type) as 'multiple-choice' | 'text' | 'textarea',
          required: Boolean(q.required),
          placeholder: (q.placeholder ?? '').toString(),
          imageUrl: (q.imageUrl ?? q.image_url ?? '').toString(),
        };
        
        // For multiple-choice, build options array with isCorrect flags
        if (isMultipleChoice && opts.length > 0) {
          payload.options = opts.map((o: any, idx: number) => {
            const optionText = o.optionText ?? o.option_text ?? '';
            const isCorrect = Boolean(o.isCorrect ?? o.is_correct ?? false);
            return {
              index: idx,
              text: optionText,
              isCorrect,
            };
          });
        }
        
        // Transform for backend API (backend expects options array and correctAnswer)
        const backendPayload: any = {
          examId: payload.examId,
          questionNumber: payload.questionNumber,
          questionText: payload.questionText,
          questionType: payload.questionType,
          required: payload.required,
          placeholder: payload.placeholder,
          imageUrl: payload.imageUrl,
        };
        
        if (isMultipleChoice && payload.options) {
          backendPayload.options = payload.options.map((opt) => opt.text);
          const correctIndex = payload.options.findIndex((opt) => opt.isCorrect);
          backendPayload.correctAnswer = correctIndex >= 0 ? correctIndex : 0;
        }
        
        await adminApi.addQuestion(backendPayload);
      }

      await loadExams();
      toast.success(`"${exam.title}" duplicated as "${newExam.title}"`);
    } catch (err: any) {
      console.error('Failed to duplicate exam:', err);
      toast.error(err.response?.data?.message || 'Failed to duplicate exam');
    } finally {
      setDuplicatingExamId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.exam) return;

    setIsDeleting(true);
    try {
      const response = await adminApi.deleteExam(deleteConfirm.exam.id);
      toast.success(response.data.message || 'Exam deleted successfully');
      await loadExams();
      setDeleteConfirm({ show: false, exam: null });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete exam');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveQuestions = async (questions: AddQuestionData[]) => {
    try {
      // Get examId from first question (all questions have same examId)
      const examId = questions[0]?.examId;
      if (!examId) {
        toast.error('No exam ID found');
        throw new Error('No exam ID found');
      }

      // Validate: every question must have non-empty text
      const emptyIndex = questions.findIndex((q) => !(typeof q.questionText === 'string' && q.questionText.trim().length > 0));
      if (emptyIndex >= 0) {
        toast.error(`Please add question text for question ${emptyIndex + 1}`);
        throw new Error('Question text is required for all questions');
      }

      // Delete all existing questions first (to avoid duplicates)
      await adminApi.deleteExamQuestions(examId);

      // Now add all questions fresh
      for (const question of questions) {
        // Transform options format for backend
        const backendQuestion: any = {
          examId: question.examId,
          questionNumber: Number(question.questionNumber) || 1,
          questionText: typeof question.questionText === 'string' ? question.questionText.trim() : '',
          questionType: question.questionType,
          required: Boolean(question.required),
          placeholder: question.placeholder ?? '',
          imageUrl: question.imageUrl ?? '',
        };

        // For multiple-choice questions, extract options array and correctAnswer index
        if (question.questionType === 'multiple-choice' && question.options) {
          backendQuestion.options = question.options.map((opt) => opt.text);
          const correctIndex = question.options.findIndex((opt) => opt.isCorrect);
          backendQuestion.correctAnswer = correctIndex >= 0 ? correctIndex : 0;
        }

        await adminApi.addQuestion(backendQuestion);
      }

      setEditingExamId(null);
      await loadExams();
    } catch (err: any) {
      console.error('Failed to save questions:', err);
      const data = err.response?.data;
      if (data?.errors?.length) {
        const first = data.errors[0];
        console.error('Validation error:', first.field, first.message);
        toast.error(`${first.field || 'Validation'}: ${first.message}`);
      } else {
        toast.error(data?.message || 'Failed to save questions');
      }
      throw err;
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
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show editor if editing an exam
  if (editingExamId) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <ExamEditor
            examId={editingExamId}
            onSave={handleSaveQuestions}
            onCancel={() => setEditingExamId(null)}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Exam Management</h1>
            <p className="text-muted-foreground">Create and manage exams</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create Exam Form */}
        {showCreateForm && (
          <CreateExamForm
            onSuccess={() => {
              setShowCreateForm(false);
              loadExams();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Exams List */}
        <div className="grid grid-cols-1 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Exam Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{exam.title}</CardTitle>
                      {exam.isActive ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>

                    {exam.description && (
                      <p className="text-muted-foreground mb-4">{exam.description}</p>
                    )}

                    {/* Exam Stats */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          <strong>{exam.durationMinutes}</strong> minutes
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          Max <strong>{exam.maxViolations}</strong> violations
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>
                          <strong>{exam.questionCount || 0}</strong> questions
                        </span>
                      </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="block font-medium mb-1 text-foreground">Version</span>
                          <span>{exam.version}</span>
                        </div>
                        <div>
                          <span className="block font-medium mb-1 text-foreground">Auto-Save</span>
                          <span>Every {exam.autoSaveIntervalSeconds}s</span>
                        </div>
                        <div>
                          <span className="block font-medium mb-1 text-foreground">Warning At</span>
                          <span>{exam.warningAtMinutes} min left</span>
                        </div>
                        <div>
                          <span className="block font-medium mb-1 text-foreground">Fullscreen</span>
                          <span>{exam.enableFullscreen ? 'Required' : 'Optional'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => handleActivateExam(exam.id, !exam.isActive)}
                      variant={exam.isActive ? "outline" : "default"}
                      size="sm"
                      title={exam.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {exam.isActive ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Activate</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setEditingExamId(exam.id)}
                      variant="outline"
                      size="sm"
                      title="Add/Edit questions"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      onClick={() => handleDuplicateExam(exam)}
                      disabled={duplicatingExamId === exam.id}
                      variant="outline"
                      size="sm"
                      title="Duplicate exam (copy settings and questions)"
                    >
                      {duplicatingExamId === exam.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      <span className="hidden sm:inline">Duplicate</span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteExam(exam)}
                      variant="destructive"
                      size="sm"
                      title="Delete exam"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {exams.length === 0 && !error && (
            <EmptyState
              icon={FileText}
              title="No exams yet"
              description="Create your first exam to get started"
              action={{
                label: "Create Exam",
                onClick: () => setShowCreateForm(true),
              }}
            />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, exam: null })}
          onConfirm={confirmDelete}
          title="Delete Exam"
          message={
            deleteConfirm.exam
              ? deleteConfirm.exam.questionCount && deleteConfirm.exam.questionCount > 0
                ? `Are you sure you want to delete "${deleteConfirm.exam.title}"? This will permanently delete ${deleteConfirm.exam.questionCount} question(s), all student sessions, responses, and violation logs. This action cannot be undone.`
                : `Are you sure you want to delete "${deleteConfirm.exam.title}"? This action cannot be undone.`
              : ''
          }
          confirmText="Delete Exam"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </AdminLayout>
  );
}

// Create Exam Form Component
function CreateExamForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<CreateExamData>({
    title: '',
    description: '',
    version: 'v1.0',
    durationMinutes: 60,
    maxViolations: 7,
    enableFullscreen: true,
    autoSaveIntervalSeconds: 5,
    warningAtMinutes: 10,
    minTimeGuaranteeMinutes: 5,
    useGroupAccess: false,
    groupIds: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableGroups, setAvailableGroups] = useState<StudentGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await adminApi.getGroups();
      setAvailableGroups(response.data.data.groups);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    const currentGroupIds = formData.groupIds || [];
    const newGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter((id) => id !== groupId)
      : [...currentGroupIds, groupId];
    setFormData({ ...formData, groupIds: newGroupIds });
  };

  const toggleAllGroups = () => {
    const currentGroupIds = formData.groupIds || [];
    const allSelected = currentGroupIds.length === availableGroups.length;
    setFormData({
      ...formData,
      groupIds: allSelected ? [] : availableGroups.map((g) => g.id),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate group selection if group-based access is enabled
    if (formData.useGroupAccess && (!formData.groupIds || formData.groupIds.length === 0)) {
      setError('Please select at least one student group when enabling group-based access.');
      return;
    }

    setIsSubmitting(true);

    try {
      await adminApi.createExam(formData);
      onSuccess();
    } catch (err) {
      setError('Failed to create exam');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Create New Exam</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Exam Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="textarea"
                rows={3}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) <span className="text-destructive">*</span></Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationMinutes || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string while typing
                  if (value === '') {
                    setFormData({ ...formData, durationMinutes: 0 });
                  } else {
                    const n = parseInt(value, 10);
                    if (!Number.isNaN(n) && n >= 1) {
                      setFormData({ ...formData, durationMinutes: n });
                    }
                  }
                }}
                onBlur={(e) => {
                  // Ensure a valid value on blur - restore default if empty or invalid
                  const value = e.target.value;
                  if (!value || value === '' || parseInt(value, 10) < 1) {
                    setFormData({ ...formData, durationMinutes: 60 });
                  }
                }}
                min="1"
                max="480"
                required
              />
            </div>

            {/* Max Violations */}
            <div className="space-y-2">
              <Label htmlFor="maxViolations">Max Violations <span className="text-destructive">*</span></Label>
              <Input
                id="maxViolations"
                type="number"
                value={formData.maxViolations || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string while typing
                  if (value === '') {
                    setFormData({ ...formData, maxViolations: 0 });
                  } else {
                    const n = parseInt(value, 10);
                    if (!Number.isNaN(n) && n >= 1) {
                      setFormData({ ...formData, maxViolations: n });
                    }
                  }
                }}
                onBlur={(e) => {
                  // Ensure a valid value on blur - restore default if empty or invalid
                  const value = e.target.value;
                  if (!value || value === '' || parseInt(value, 10) < 1) {
                    setFormData({ ...formData, maxViolations: 7 });
                  }
                }}
                min="1"
                max="20"
                required
              />
            </div>

            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>

            {/* Auto-save interval */}
            <div className="space-y-2">
              <Label htmlFor="autoSave">Auto-save Interval (seconds)</Label>
              <Input
                id="autoSave"
                type="number"
                value={Number.isFinite(formData.autoSaveIntervalSeconds) ? formData.autoSaveIntervalSeconds : ''}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n)) setFormData({ ...formData, autoSaveIntervalSeconds: n });
                }}
                min="1"
                max="60"
              />
            </div>
          </div>

          {/* Group-Based Access Control */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="useGroupAccess"
                checked={formData.useGroupAccess}
                onChange={(e) => setFormData({ ...formData, useGroupAccess: e.target.checked })}
                className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
              />
              <Label htmlFor="useGroupAccess" className="flex items-center gap-2 cursor-pointer">
                <UsersRound className="w-5 h-5 text-primary" />
                Enable Group-Based Access
              </Label>
            </div>

            {formData.useGroupAccess && (
              <div className="bg-muted border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="mb-0">
                    Select Student Groups <span className="text-destructive">*</span>
                    {formData.groupIds && formData.groupIds.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {formData.groupIds.length} group(s) selected
                      </Badge>
                    )}
                  </Label>
                  {availableGroups.length > 0 && (
                    <Button
                      type="button"
                      onClick={toggleAllGroups}
                      variant="ghost"
                      size="sm"
                    >
                      {formData.groupIds?.length === availableGroups.length ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {isLoadingGroups ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading groups...
                  </div>
                ) : availableGroups.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No student groups available. Create groups first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {availableGroups.map((group) => {
                      const isSelected = formData.groupIds?.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => toggleGroupSelection(group.id)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-background hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary flex-shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{group.name}</div>
                              {group.description && (
                                <div className="text-sm text-muted-foreground mt-1">{group.description}</div>
                              )}
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{group.memberCount || 0} members</span>
                                {group.examCount !== undefined && <span>{group.examCount} exams</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {formData.useGroupAccess && (!formData.groupIds || formData.groupIds.length === 0) && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please select at least one group to restrict access.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!formData.useGroupAccess && (
              <Alert className="text-sm">
                <AlertDescription>
                  All authorized students will be able to access this exam.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" onClick={onCancel} variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Exam'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
