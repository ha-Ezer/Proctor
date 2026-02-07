import { useEffect, useState } from 'react';
import { adminApi, StudentInfo } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import ConfirmModal from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Student Management</h1>
            <p className="text-muted-foreground">Manage authorized students</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
        <Card>
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          {student.fullName ? (
                            <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground italic">Pending Registration</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!student.fullName ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                            Awaiting Name
                          </Badge>
                        ) : student.isAuthorized ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                            Authorized
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unauthorized</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.totalSessions || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.lastLogin
                          ? new Date(student.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleRemoveStudent(student.email, student.fullName)}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Remove student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <CardContent className="p-12">
              <EmptyState
                icon={Users}
                title="No students yet"
                description="Add your first student to get started"
                action={{
                  label: "Add Student",
                  onClick: () => setShowAddForm(true),
                }}
              />
            </CardContent>
          )}
        </Card>

        {/* Summary */}
        {students.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Total: <strong className="text-foreground">{students.length}</strong> students
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
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Add New Student</CardTitle>
        <p className="text-sm text-muted-foreground">
          Student will provide their full name when they first login with this email.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
              />
            </div>
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
                  Adding...
                </>
              ) : (
                'Add Student'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
