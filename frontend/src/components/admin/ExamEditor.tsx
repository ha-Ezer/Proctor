import { useState, useEffect } from 'react';
import { Plus, Trash2, X, GripVertical, Copy, Image as ImageIcon, Loader2, UsersRound, CheckSquare, Square, AlertCircle, Settings } from 'lucide-react';
import { AddQuestionData, adminApi, ExamDetails, StudentGroup } from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface Question {
  questionNumber: number;
  questionText: string;
  questionType: 'multiple-choice' | 'text' | 'textarea';
  required: boolean;
  placeholder?: string;
  imageUrl?: string;
  options?: Array<{ index: number; text: string; isCorrect: boolean }>;
}

interface ExamEditorProps {
  examId: string;
  onSave: (questions: AddQuestionData[]) => Promise<void>;
  onCancel: () => void;
}

export function ExamEditor({ examId, onSave, onCancel }: ExamEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Exam details (for header and edit-settings modal)
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [showEditSettingsModal, setShowEditSettingsModal] = useState(false);
  const [editSettingsForm, setEditSettingsForm] = useState<{
    title: string;
    description: string;
    version: string;
    durationMinutes: number;
    maxViolations: number;
    autoSaveIntervalSeconds: number;
    enableFullscreen: boolean;
    warningAtMinutes: number;
    minTimeGuaranteeMinutes: number;
  } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Group settings state
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<StudentGroup[]>([]);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);
  const [useGroupAccess, setUseGroupAccess] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isSavingGroups, setIsSavingGroups] = useState(false);

  // Load existing questions when component mounts
  useEffect(() => {
    loadExistingQuestions();
    loadExamDetails();
  }, [examId]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Wrapper to mark changes as unsaved
  const updateQuestions = (newQuestions: Question[] | ((prev: Question[]) => Question[])) => {
    setQuestions(newQuestions);
    setHasUnsavedChanges(true);
  };

  const loadExamDetails = async () => {
    try {
      const response = await adminApi.getExamById(examId);
      const data = response.data.data;
      setExamDetails(data);
      setUseGroupAccess(data.useGroupAccess || false);
    } catch (error) {
      console.error('Failed to load exam details:', error);
    }
  };

  const openEditSettingsModal = () => {
    if (!examDetails) return;
    setEditSettingsForm({
      title: examDetails.title,
      description: examDetails.description || '',
      version: examDetails.version || 'v1.0',
      durationMinutes: examDetails.durationMinutes,
      maxViolations: examDetails.maxViolations,
      autoSaveIntervalSeconds: examDetails.autoSaveIntervalSeconds ?? 5,
      enableFullscreen: examDetails.enableFullscreen ?? true,
      warningAtMinutes: examDetails.warningAtMinutes ?? 10,
      minTimeGuaranteeMinutes: examDetails.minTimeGuaranteeMinutes ?? 5,
    });
    setShowEditSettingsModal(true);
  };

  const handleSaveEditSettings = async () => {
    if (!editSettingsForm) return;
    setIsSavingSettings(true);
    try {
      await adminApi.updateExam(examId, {
        title: editSettingsForm.title,
        description: editSettingsForm.description || undefined,
        version: editSettingsForm.version,
        durationMinutes: editSettingsForm.durationMinutes,
        maxViolations: editSettingsForm.maxViolations,
        autoSaveIntervalSeconds: editSettingsForm.autoSaveIntervalSeconds,
        enableFullscreen: editSettingsForm.enableFullscreen,
        warningAtMinutes: editSettingsForm.warningAtMinutes,
        minTimeGuaranteeMinutes: editSettingsForm.minTimeGuaranteeMinutes,
      });
      await loadExamDetails();
      setShowEditSettingsModal(false);
      setEditSettingsForm(null);
      toast.success('Exam settings updated');
    } catch (error) {
      console.error('Failed to update exam settings:', error);
      toast.error('Failed to update exam settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const loadGroupSettings = async () => {
    setIsLoadingGroups(true);
    try {
      // Load all available groups
      const groupsResponse = await adminApi.getGroups();
      setAvailableGroups(groupsResponse.data.data.groups);

      // Load currently assigned groups
      const assignedResponse = await adminApi.getExamGroups(examId);
      const assigned = assignedResponse.data.data.groups.map((g: any) => g.id);
      setAssignedGroupIds(assigned);
    } catch (error) {
      console.error('Failed to load group settings:', error);
      toast.error('Failed to load group settings');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setAssignedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleAllGroups = () => {
    if (assignedGroupIds.length === availableGroups.length) {
      setAssignedGroupIds([]);
    } else {
      setAssignedGroupIds(availableGroups.map((g) => g.id));
    }
  };

  const handleSaveGroupSettings = async () => {
    if (useGroupAccess && assignedGroupIds.length === 0) {
      toast.error('Please select at least one group when enabling group-based access');
      return;
    }

    setIsSavingGroups(true);
    try {
      // First, update exam's useGroupAccess flag
      await adminApi.updateExam(examId, { useGroupAccess });

      // Get current assignments
      const currentResponse = await adminApi.getExamGroups(examId);
      const currentGroupIds = currentResponse.data.data.groups.map((g: any) => g.id);

      // Remove groups that are no longer assigned
      for (const groupId of currentGroupIds) {
        if (!assignedGroupIds.includes(groupId)) {
          await adminApi.removeGroupFromExam(examId, groupId);
        }
      }

      // Add newly assigned groups
      for (const groupId of assignedGroupIds) {
        if (!currentGroupIds.includes(groupId)) {
          await adminApi.assignGroupToExam(examId, groupId);
        }
      }

      toast.success('Group settings saved successfully!');
      setShowGroupSettings(false);
      await loadExamDetails();
    } catch (error) {
      console.error('Failed to save group settings:', error);
      toast.error('Failed to save group settings');
    } finally {
      setIsSavingGroups(false);
    }
  };

  const loadExistingQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getExamQuestions(examId);
      const existingQuestions = response.data.data.questions;

      // Transform backend format to component format
      const transformedQuestions = existingQuestions.map((q: any) => ({
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionType: q.questionType,
        required: q.required,
        placeholder: q.placeholder || '',
        imageUrl: q.imageUrl || '',
        options: q.options
          ? q.options.map((opt: any) => ({
              index: opt.optionIndex,
              text: opt.optionText,
              isCorrect: opt.isCorrect,
            }))
          : [],
      }));

      setQuestions(transformedQuestions);
      if (transformedQuestions.length > 0) {
        toast.success(`Loaded ${transformedQuestions.length} existing questions`);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error('Failed to load existing questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to transform image URLs for display
  const transformImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    // Transform attachments/ to /images/
    if (url.startsWith('attachments/')) {
      return url.replace('attachments/', '/images/');
    }
    return url;
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      questionNumber: questions.length + 1,
      questionText: '',
      questionType: 'multiple-choice',
      required: false,
      placeholder: '',
      imageUrl: '',
      options: [
        { index: 0, text: '', isCorrect: false },
        { index: 1, text: '', isCorrect: false },
        { index: 2, text: '', isCorrect: false },
        { index: 3, text: '', isCorrect: false },
      ],
    };
    updateQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    // Renumber questions
    updated.forEach((q, i) => {
      q.questionNumber = i + 1;
    });
    updateQuestions(updated);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    updateQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex].text = text;
    }
    updateQuestions(updated);
  };

  const setCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options!.forEach((opt, i) => {
        opt.isCorrect = i === optionIndex;
      });
    }
    updateQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      const newIndex = updated[questionIndex].options!.length;
      updated[questionIndex].options!.push({
        index: newIndex,
        text: '',
        isCorrect: false,
      });
    }
    updateQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options && updated[questionIndex].options!.length > 2) {
      updated[questionIndex].options = updated[questionIndex].options!.filter((_, i) => i !== optionIndex);
      // Reindex options
      updated[questionIndex].options!.forEach((opt, i) => {
        opt.index = i;
      });
    }
    updateQuestions(updated);
  };

  const parseBulkPaste = () => {
    const loadingToast = toast.loading('Parsing questions...');

    try {
      // More robust cleaning
      let cleanedText = bulkPasteText.trim();

      // Remove single-line comments
      cleanedText = cleanedText.replace(/\/\/.*$/gm, '');

      // Remove variable declaration (const examSetX =)
      cleanedText = cleanedText.replace(/^(const|let|var)\s+\w+\s*=\s*/, '');

      // Remove trailing semicolons and whitespace
      cleanedText = cleanedText.replace(/;?\s*$/, '');

      // Ensure it starts with [ and ends with ]
      if (!cleanedText.startsWith('[')) {
        cleanedText = '[' + cleanedText;
      }
      if (!cleanedText.endsWith(']')) {
        cleanedText = cleanedText + ']';
      }

      // Convert JavaScript object notation to proper JSON format
      // This handles unquoted keys and single quotes
      let jsonText = cleanedText
        // Replace single quotes with double quotes
        .replace(/'/g, '"')
        // Add quotes around unquoted keys (handles word characters and hyphens)
        .replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:')
        // Fix any double-quoted keys that got double-double-quoted
        .replace(/""+/g, '"')
        // Handle trailing commas before ] or }
        .replace(/,(\s*[}\]])/g, '$1');

      let parsed: any[];
      try {
        parsed = JSON.parse(jsonText);
      } catch (jsonError) {
        // If standard JSON parsing fails, try a more lenient approach
        // by removing any remaining problematic characters
        try {
          jsonText = jsonText
            // Remove any remaining trailing commas
            .replace(/,\s*]/g, ']')
            .replace(/,\s*}/g, '}');
          parsed = JSON.parse(jsonText);
        } catch {
          throw new Error('Unable to parse the pasted content. Please ensure it is valid JSON or JavaScript object notation.');
        }
      }

      if (!Array.isArray(parsed)) {
        toast.error('Invalid format. Please paste a valid array of questions.', { id: loadingToast });
        return;
      }

      if (parsed.length === 0) {
        toast.error('No questions found in the pasted content.', { id: loadingToast });
        return;
      }

      const newQuestions: Question[] = parsed.map((item: any, index: number) => {
        const question: Question = {
          questionNumber: questions.length + index + 1,
          questionText: item.question || '',
          questionType: item.type === 'text' ? 'text' : item.type === 'textarea' ? 'textarea' : 'multiple-choice',
          required: item.required !== undefined ? item.required : false,
          placeholder: item.placeholder || '',
          imageUrl: item.image || '',
          options: undefined,
        };

        if (item.options && Array.isArray(item.options)) {
          question.options = item.options.map((optText: string, optIndex: number) => ({
            index: optIndex,
            text: optText,
            isCorrect: item.correctAnswer === optIndex,
          }));
        }

        return question;
      });

      updateQuestions([...questions, ...newQuestions]);
      setShowBulkPaste(false);
      setBulkPasteText('');

      toast.success(
        `Successfully parsed ${newQuestions.length} question${newQuestions.length !== 1 ? 's' : ''}! 🎉`,
        {
          id: loadingToast,
          duration: 4000,
        }
      );
    } catch (error) {
      console.error('Parse error:', error);
      toast.error(
        `Failed to parse questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          id: loadingToast,
          duration: 5000,
        }
      );
    }
  };

  const handleSave = async () => {
    // Validate questions
    const hasEmptyQuestions = questions.some((q) => !q.questionText.trim());
    if (hasEmptyQuestions) {
      toast.error('Please fill in all question texts before saving.');
      return;
    }

    const hasEmptyOptions = questions.some(
      (q) =>
        q.questionType === 'multiple-choice' &&
        q.options?.some((opt) => !opt.text.trim())
    );
    if (hasEmptyOptions) {
      toast.error('Please fill in all option texts for multiple-choice questions.');
      return;
    }

    const hasNoCorrectAnswer = questions.some(
      (q) =>
        q.questionType === 'multiple-choice' &&
        !q.options?.some((opt) => opt.isCorrect)
    );
    if (hasNoCorrectAnswer) {
      toast.error('Please mark the correct answer for all multiple-choice questions.');
      return;
    }

    setIsSaving(true);
    const savingToast = toast.loading(`Saving ${questions.length} question${questions.length !== 1 ? 's' : ''}...`);

    try {
      const questionsToSave: AddQuestionData[] = questions.map((q) => ({
        examId,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionType: q.questionType,
        required: q.required,
        placeholder: q.placeholder,
        imageUrl: q.imageUrl,
        options: q.options,
      }));

      await onSave(questionsToSave);
      setHasUnsavedChanges(false);
      toast.success(`Successfully saved ${questions.length} question${questions.length !== 1 ? 's' : ''}! ✅`, {
        id: savingToast,
        duration: 4000,
      });
    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Failed to save questions. Please try again.`, {
        id: savingToast,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Editor</h2>
          <p className="text-sm text-gray-600 mt-1">
            {questions.length > 0
              ? `Editing ${questions.length} question${questions.length !== 1 ? 's' : ''}`
              : 'Add questions manually or paste from your existing format'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openEditSettingsModal}
            disabled={!examDetails}
            className="btn btn-secondary flex items-center gap-2"
            title="Edit exam title, duration, and other settings"
          >
            <Settings className="w-4 h-4" />
            Edit settings
          </button>
          <button
            onClick={() => {
              setShowGroupSettings(true);
              loadGroupSettings();
            }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <UsersRound className="w-4 h-4" />
            Group Settings
          </button>
          <button
            onClick={() => setShowBulkPaste(true)}
            className="btn btn-secondary"
          >
            <Copy className="w-4 h-4" />
            Bulk Paste
          </button>
          <button onClick={addQuestion} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {/* Edit Exam Settings Modal */}
      {showEditSettingsModal && editSettingsForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Exam Settings</h3>
              <button
                onClick={() => { setShowEditSettingsModal(false); setEditSettingsForm(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="label">Exam Title *</label>
                  <input
                    type="text"
                    value={editSettingsForm.title}
                    onChange={(e) => setEditSettingsForm({ ...editSettingsForm, title: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={editSettingsForm.description}
                    onChange={(e) => setEditSettingsForm({ ...editSettingsForm, description: e.target.value })}
                    className="textarea w-full"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Duration (minutes) *</label>
                    <input
                      type="number"
                      value={editSettingsForm.durationMinutes || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string while typing
                        if (value === '') {
                          setEditSettingsForm({ ...editSettingsForm, durationMinutes: 0 });
                        } else {
                          const n = parseInt(value, 10);
                          if (!Number.isNaN(n) && n >= 1) {
                            setEditSettingsForm({ ...editSettingsForm, durationMinutes: n });
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure a valid value on blur - restore previous value or default if empty or invalid
                        const value = e.target.value;
                        if (!value || value === '' || parseInt(value, 10) < 1) {
                          setEditSettingsForm({ ...editSettingsForm, durationMinutes: editSettingsForm.durationMinutes || 60 });
                        }
                      }}
                      className="input w-full"
                      min={1}
                      max={480}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Max Violations *</label>
                    <input
                      type="number"
                      value={editSettingsForm.maxViolations || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string while typing
                        if (value === '') {
                          setEditSettingsForm({ ...editSettingsForm, maxViolations: 0 });
                        } else {
                          const n = parseInt(value, 10);
                          if (!Number.isNaN(n) && n >= 1) {
                            setEditSettingsForm({ ...editSettingsForm, maxViolations: n });
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure a valid value on blur - restore previous value or default if empty or invalid
                        const value = e.target.value;
                        if (!value || value === '' || parseInt(value, 10) < 1) {
                          setEditSettingsForm({ ...editSettingsForm, maxViolations: editSettingsForm.maxViolations || 7 });
                        }
                      }}
                      className="input w-full"
                      min={1}
                      max={20}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Version</label>
                    <input
                      type="text"
                      value={editSettingsForm.version}
                      onChange={(e) => setEditSettingsForm({ ...editSettingsForm, version: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label">Auto-save interval (seconds)</label>
                    <input
                      type="number"
                      value={Number.isFinite(editSettingsForm.autoSaveIntervalSeconds) ? editSettingsForm.autoSaveIntervalSeconds : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n)) setEditSettingsForm({ ...editSettingsForm, autoSaveIntervalSeconds: n });
                      }}
                      className="input w-full"
                      min={1}
                      max={60}
                    />
                  </div>
                  <div>
                    <label className="label">Warning at (minutes left)</label>
                    <input
                      type="number"
                      value={Number.isFinite(editSettingsForm.warningAtMinutes) ? editSettingsForm.warningAtMinutes : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n)) setEditSettingsForm({ ...editSettingsForm, warningAtMinutes: n });
                      }}
                      className="input w-full"
                      min={0}
                      max={120}
                    />
                  </div>
                  <div>
                    <label className="label">Min time guarantee (minutes)</label>
                    <input
                      type="number"
                      value={Number.isFinite(editSettingsForm.minTimeGuaranteeMinutes) ? editSettingsForm.minTimeGuaranteeMinutes : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n)) setEditSettingsForm({ ...editSettingsForm, minTimeGuaranteeMinutes: n });
                      }}
                      className="input w-full"
                      min={0}
                      max={60}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="editEnableFullscreen"
                    checked={editSettingsForm.enableFullscreen}
                    onChange={(e) => setEditSettingsForm({ ...editSettingsForm, enableFullscreen: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="editEnableFullscreen" className="font-medium text-gray-900 cursor-pointer">
                    Fullscreen required
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowEditSettingsModal(false); setEditSettingsForm(null); }}
                className="btn btn-secondary"
                disabled={isSavingSettings}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditSettings}
                disabled={isSavingSettings || !editSettingsForm.title.trim()}
                className="btn btn-primary"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save settings'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Paste Modal */}
      {showBulkPaste && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Bulk Paste Questions</h3>
              <button
                onClick={() => setShowBulkPaste(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Paste your exam questions in the format below. The system will automatically parse them.
              </p>
              <textarea
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                className="input font-mono text-sm h-96"
                placeholder="const examSet1 = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'What is 2+2?',
    required: false,
    options: ['3', '4', '5', '6'],
    correctAnswer: 1
  },
  {
    id: 'q2',
    type: 'text',
    question: 'Explain your answer',
    required: false,
    placeholder: 'Type here...'
  }
];"
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkPaste(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={parseBulkPaste} className="btn btn-primary">
                Parse & Add Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Group Access Settings</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Control which student groups can access this exam
                </p>
              </div>
              <button
                onClick={() => setShowGroupSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Enable Group Access Toggle */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useGroupAccessToggle"
                    checked={useGroupAccess}
                    onChange={(e) => setUseGroupAccess(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="useGroupAccessToggle"
                    className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer"
                  >
                    <UsersRound className="w-5 h-5 text-primary-600" />
                    Enable Group-Based Access
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-7">
                  {useGroupAccess
                    ? 'Only students in the selected groups will be able to access this exam'
                    : 'All authorized students will be able to access this exam'}
                </p>
              </div>

              {/* Group Selection */}
              {useGroupAccess && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="label mb-0">
                      Select Student Groups *
                      {assignedGroupIds.length > 0 && (
                        <span className="ml-2 text-sm text-primary-600 font-normal">
                          {assignedGroupIds.length} group(s) selected
                        </span>
                      )}
                    </label>
                    {availableGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAllGroups}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        {assignedGroupIds.length === availableGroups.length ? (
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
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                      <p className="text-gray-600">Loading groups...</p>
                    </div>
                  ) : availableGroups.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <UsersRound className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No student groups available</p>
                      <p className="text-sm text-gray-500 mt-1">Create groups first in the Groups page</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-3">
                      {availableGroups.map((group) => {
                        const isSelected = assignedGroupIds.includes(group.id);
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
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {useGroupAccess && assignedGroupIds.length === 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Please select at least one group to restrict access.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowGroupSettings(false)}
                className="btn btn-secondary"
                disabled={isSavingGroups}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroupSettings}
                className="btn btn-primary flex items-center gap-2"
                disabled={isSavingGroups}
              >
                {isSavingGroups ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UsersRound className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="card border-2 border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-2">
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex-1 space-y-4">
                {/* Question Number & Type */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded">
                    Q{question.questionNumber}
                  </span>
                  <select
                    value={question.questionType}
                    onChange={(e) =>
                      updateQuestion(qIndex, 'questionType', e.target.value)
                    }
                    className="input w-48"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) =>
                        updateQuestion(qIndex, 'required', e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    Required
                  </label>
                </div>

                {/* Question Text */}
                <div>
                  <label className="label">Question Text</label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) =>
                      updateQuestion(qIndex, 'questionText', e.target.value)
                    }
                    className="input"
                    rows={2}
                    placeholder="Enter your question here..."
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="label">Image URL (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={question.imageUrl || ''}
                      onChange={(e) =>
                        updateQuestion(qIndex, 'imageUrl', e.target.value)
                      }
                      className="input flex-1"
                      placeholder="attachments/Normal Mole.jpg or /images/Albinism.png or https://..."
                    />
                    {question.imageUrl && (
                      <button
                        onClick={() => updateQuestion(qIndex, 'imageUrl', '')}
                        className="btn btn-secondary"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {question.imageUrl && (
                    <div className="mt-2 relative">
                      <img
                        src={transformImageUrl(question.imageUrl)}
                        alt="Question preview"
                        className="max-w-md max-h-64 object-contain rounded border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">Image failed to load. Please check the URL.</div>';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Options for Multiple Choice */}
                {question.questionType === 'multiple-choice' && question.options && (
                  <div>
                    <label className="label">Answer Options</label>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={option.isCorrect}
                            onChange={() => setCorrectAnswer(qIndex, oIndex)}
                            className="flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, e.target.value)
                            }
                            className="input flex-1"
                            placeholder={`Option ${oIndex + 1}`}
                          />
                          {question.options!.length > 2 && (
                            <button
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="btn btn-secondary"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(qIndex)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Select the radio button next to the correct answer
                    </p>
                  </div>
                )}

                {/* Placeholder for Text Questions */}
                {(question.questionType === 'text' || question.questionType === 'textarea') && (
                  <div>
                    <label className="label">Placeholder Text (Optional)</label>
                    <input
                      type="text"
                      value={question.placeholder || ''}
                      onChange={(e) =>
                        updateQuestion(qIndex, 'placeholder', e.target.value)
                      }
                      className="input"
                      placeholder="Type your answer here..."
                    />
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeQuestion(qIndex)}
                className="flex-shrink-0 text-danger-600 hover:text-danger-700 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No questions added yet</p>
            <button onClick={addQuestion} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Add First Question
            </button>
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg mt-8 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={addQuestion}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            {questions.length > 0 && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary"
              >
                {isSaving ? 'Saving...' : `Save ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
