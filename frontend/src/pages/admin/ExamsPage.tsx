import { useEffect, useState } from 'react';
import { adminApi, ExamDetails, CreateExamData, AddQuestionData, StudentGroup } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExamEditor } from '@/components/admin/ExamEditor';
import ConfirmModal from '@/components/common/ConfirmModal';
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
        throw new Error('No exam ID found');
      }

      // Delete all existing questions first (to avoid duplicates)
      await adminApi.deleteExamQuestions(examId);

      // Now add all questions fresh
      for (const question of questions) {
        // Transform options format for backend
        const backendQuestion: any = {
          examId: question.examId,
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          questionType: question.questionType,
          required: question.required || false,
          placeholder: question.placeholder || '',
          imageUrl: question.imageUrl || '',
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
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      throw err;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Management</h1>
            <p className="text-gray-600">Create and manage exams</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Exam</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-danger-50 border-danger-200 mb-6">
            <p className="text-danger-800">{error}</p>
          </div>
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
            <div key={exam.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                {/* Exam Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                    {exam.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>

                  {exam.description && (
                    <p className="text-gray-600 mb-4">{exam.description}</p>
                  )}

                  {/* Exam Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        <strong>{exam.durationMinutes}</strong> minutes
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        Max <strong>{exam.maxViolations}</strong> violations
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>
                        <strong>{exam.questionCount || 0}</strong> questions
                      </span>
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="block font-medium mb-1">Version</span>
                        <span>{exam.version}</span>
                      </div>
                      <div>
                        <span className="block font-medium mb-1">Auto-Save</span>
                        <span>Every {exam.autoSaveIntervalSeconds}s</span>
                      </div>
                      <div>
                        <span className="block font-medium mb-1">Warning At</span>
                        <span>{exam.warningAtMinutes} min left</span>
                      </div>
                      <div>
                        <span className="block font-medium mb-1">Fullscreen</span>
                        <span>{exam.enableFullscreen ? 'Required' : 'Optional'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleActivateExam(exam.id, !exam.isActive)}
                    className={`btn ${
                      exam.isActive ? 'btn-secondary' : 'btn-primary'
                    } flex items-center gap-2`}
                    title={exam.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {exam.isActive ? (
                      <>
                        <PowerOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Deactivate</span>
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4" />
                        <span className="hidden sm:inline">Activate</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingExamId(exam.id)}
                    className="btn btn-secondary flex items-center gap-2"
                    title="Add/Edit questions"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam)}
                    className="btn btn-danger flex items-center gap-2"
                    title="Delete exam"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {exams.length === 0 && !error && (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
              <p className="text-gray-600 mb-4">Create your first exam to get started</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Exam</span>
              </button>
            </div>
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
    <div className="card mb-6 bg-primary-50 border-primary-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Exam</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="label">Exam Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="textarea"
              rows={3}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="label">Duration (minutes) *</label>
            <input
              type="number"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
              className="input"
              min="1"
              max="480"
              required
            />
          </div>

          {/* Max Violations */}
          <div>
            <label className="label">Max Violations *</label>
            <input
              type="number"
              value={formData.maxViolations}
              onChange={(e) => setFormData({ ...formData, maxViolations: parseInt(e.target.value) })}
              className="input"
              min="1"
              max="20"
              required
            />
          </div>

          {/* Version */}
          <div>
            <label className="label">Version</label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="input"
            />
          </div>

          {/* Auto-save interval */}
          <div>
            <label className="label">Auto-save Interval (seconds)</label>
            <input
              type="number"
              value={formData.autoSaveIntervalSeconds}
              onChange={(e) =>
                setFormData({ ...formData, autoSaveIntervalSeconds: parseInt(e.target.value) })
              }
              className="input"
              min="1"
              max="60"
            />
          </div>
        </div>

        {/* Group-Based Access Control */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="useGroupAccess"
              checked={formData.useGroupAccess}
              onChange={(e) => setFormData({ ...formData, useGroupAccess: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="useGroupAccess" className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer">
              <UsersRound className="w-5 h-5 text-primary-600" />
              Enable Group-Based Access
            </label>
          </div>

          {formData.useGroupAccess && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">
                  Select Student Groups *
                  {formData.groupIds && formData.groupIds.length > 0 && (
                    <span className="ml-2 text-sm text-primary-600 font-normal">
                      {formData.groupIds.length} group(s) selected
                    </span>
                  )}
                </label>
                {availableGroups.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllGroups}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    {formData.groupIds?.length === availableGroups.length ? (
                      <>
                        <Square className="w-4 h-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Select All
                      </>
                    )}
                  </button>
                )}
              </div>

              {isLoadingGroups ? (
                <div className="text-center py-4 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading groups...
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No student groups available. Create groups first.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableGroups.map((group) => {
                    const isSelected = formData.groupIds?.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroupSelection(group.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{group.name}</div>
                            {group.description && (
                              <div className="text-sm text-gray-600 mt-1">{group.description}</div>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
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
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Please select at least one group to restrict access.
                </div>
              )}
            </div>
          )}

          {!formData.useGroupAccess && (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
              All authorized students will be able to access this exam.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Exam</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
