import { useEffect, useState } from 'react';
import { adminApi, StudentInfo } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { Plus, Users, Trash2, Loader2, Mail, User as UserIcon } from 'lucide-react';

export function StudentsPage() {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; email: string; fullName: string | null }>({
    show: false,
    email: '',
    fullName: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getStudents();
      setStudents(response.data.data.students);
    } catch (err) {
      setError('Failed to load students');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = (email: string, fullName: string | null) => {
    setDeleteConfirm({ show: true, email, fullName });
  };

  const confirmRemove = async () => {
    setIsDeleting(true);
    try {
      await adminApi.removeStudent(deleteConfirm.email);
      await loadStudents();
      toast.success('Student removed successfully');
      setDeleteConfirm({ show: false, email: '', fullName: null });
    } catch (err) {
      toast.error('Failed to remove student');
      console.error(err);
    } finally {
      setIsDeleting(false);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
            <p className="text-gray-600">Manage authorized students</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-danger-50 border-danger-200 mb-6">
            <p className="text-danger-800">{error}</p>
          </div>
        )}

        {/* Add Student Form */}
        {showAddForm && (
          <AddStudentForm
            onSuccess={() => {
              setShowAddForm(false);
              loadStudents();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Students Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-primary-600" />
                        </div>
                        {student.fullName ? (
                          <span className="text-sm font-medium text-gray-900">{student.fullName}</span>
                        ) : (
                          <span className="text-sm font-medium text-gray-400 italic">Pending Registration</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{student.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!student.fullName ? (
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                          Awaiting Name
                        </span>
                      ) : student.isAuthorized ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Authorized
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          Unauthorized
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.totalSessions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.lastLogin
                        ? new Date(student.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemoveStudent(student.email, student.fullName)}
                        className="text-danger-600 hover:text-danger-800 transition-colors"
                        title="Remove student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {students.length === 0 && !error && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                <p className="text-gray-600 mb-4">Add your first student to get started</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Student</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {students.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Total: <strong>{students.length}</strong> students
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, email: '', fullName: null })}
          onConfirm={confirmRemove}
          title="Remove Student"
          message={`Are you sure you want to remove ${
            deleteConfirm.fullName || deleteConfirm.email
          }? This will remove their authorization but keep their exam history.`}
          confirmText="Remove Student"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </AdminLayout>
  );
}

// Add Student Form Component
function AddStudentForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await adminApi.addStudent({ email });
      onSuccess();
    } catch (err) {
      setError('Failed to add student');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card mb-6 bg-primary-50 border-primary-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Student</h2>
      <p className="text-sm text-gray-600 mb-4">
        Student will provide their full name when they first login with this email.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="label">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="student@example.com"
              required
            />
          </div>
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
                <span>Adding...</span>
              </>
            ) : (
              <span>Add Student</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
