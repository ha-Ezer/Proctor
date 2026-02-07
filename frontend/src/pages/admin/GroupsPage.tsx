import { useEffect, useState } from 'react';
import { adminApi, StudentGroup, GroupMember, StudentInfo } from '@/lib/adminApi';
import { AdminLayout } from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  Loader2,
  X,
  Check,
  AlertCircle,
  UserPlus,
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';

export function GroupsPage() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Add members states
  const [availableStudents, setAvailableStudents] = useState<StudentInfo[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Confirmation modal states
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<StudentGroup | null>(null);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<GroupMember | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await adminApi.getGroups();
      setGroups(response.data.data.groups);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load groups');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await adminApi.createGroup({ name: groupName, description: groupDescription });
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
      await loadGroups();
      toast.success('Group created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    setIsSaving(true);
    try {
      await adminApi.updateGroup(editingGroup.id, { name: groupName, description: groupDescription });
      setShowEditModal(false);
      setEditingGroup(null);
      setGroupName('');
      setGroupDescription('');
      await loadGroups();
      toast.success('Group updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupConfirm) return;

    try {
      await adminApi.deleteGroup(deleteGroupConfirm.id);
      await loadGroups();
      toast.success('Group deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeleteGroupConfirm(null);
    }
  };

  const openEditModal = (group: StudentGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setShowEditModal(true);
  };

  const openMembersModal = async (group: StudentGroup) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
    setIsLoadingMembers(true);

    try {
      const response = await adminApi.getGroupMembers(group.id);
      setGroupMembers(response.data.data.members);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load members');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedGroup || !removeMemberConfirm) return;

    try {
      await adminApi.removeStudentFromGroup(selectedGroup.id, removeMemberConfirm.id);
      // Reload members
      const response = await adminApi.getGroupMembers(selectedGroup.id);
      setGroupMembers(response.data.data.members);
      await loadGroups(); // Update member counts
      toast.success('Member removed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoveMemberConfirm(null);
    }
  };

  const loadAvailableStudents = async () => {
    if (!selectedGroup) return;

    setIsLoadingStudents(true);
    try {
      const [studentsResponse, membersResponse] = await Promise.all([
        adminApi.getStudents(),
        adminApi.getGroupMembers(selectedGroup.id),
      ]);

      const allStudents = studentsResponse.data.data.students;
      const currentMemberIds = new Set(membersResponse.data.data.members.map((m: GroupMember) => m.id));

      // Filter out students already in the group
      const available = allStudents.filter((s) => !currentMemberIds.has(s.id));
      setAvailableStudents(available);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load students');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudentIds(newSelection);
  };

  const toggleAllVisible = () => {
    const filteredStudents = availableStudents.filter((student) => {
      const query = searchQuery.toLowerCase();
      return (
        (student.fullName?.toLowerCase().includes(query) ?? false) ||
        student.email.toLowerCase().includes(query)
      );
    });

    const allVisible = filteredStudents.every((s) => selectedStudentIds.has(s.id));

    const newSelection = new Set(selectedStudentIds);
    if (allVisible) {
      // Deselect all visible
      filteredStudents.forEach((s) => newSelection.delete(s.id));
    } else {
      // Select all visible
      filteredStudents.forEach((s) => newSelection.add(s.id));
    }
    setSelectedStudentIds(newSelection);
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || selectedStudentIds.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsSaving(true);
    try {
      let addedCount = 0;
      for (const studentId of selectedStudentIds) {
        try {
          await adminApi.addStudentToGroup(selectedGroup.id, studentId);
          addedCount++;
        } catch (err) {
          console.error(`Failed to add student ${studentId}:`, err);
        }
      }

      toast.success(`Successfully added ${addedCount} student(s) to the group`);
      setShowAddMembersModal(false);
      setSelectedStudentIds(new Set());
      setSearchQuery('');

      // Reload members
      const membersResponse = await adminApi.getGroupMembers(selectedGroup.id);
      setGroupMembers(membersResponse.data.data.members);
      await loadGroups(); // Update member counts
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add members');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Loading groups...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Groups</h1>
            <p className="text-muted-foreground mt-1">Organize students and control exam access</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed border-border">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No groups yet</h3>
            <p className="text-muted-foreground mb-4">Create your first student group to get started</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              Create Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
                    {group.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border">
                  <div>
                    <div className="text-2xl font-bold text-primary">{group.memberCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{group.examCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Exams</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openMembersModal(group)}
                    className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Members
                  </button>
                  <button
                    onClick={() => openEditModal(group)}
                    className="btn btn-secondary flex items-center justify-center"
                    title="Edit group"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteGroupConfirm(group)}
                    className="btn btn-danger flex items-center justify-center"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg shadow-xl max-w-md w-full border border-border" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Create New Group</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div>
                  <label htmlFor="name" className="label">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="input"
                    placeholder="e.g., CS101 Section A"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="description" className="label">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Brief description of this group..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary flex-1"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {showEditModal && editingGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg shadow-xl max-w-md w-full border border-border" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Edit Group</h2>
                <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditGroup} className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-name" className="label">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="label">
                    Description (Optional)
                  </label>
                  <textarea
                    id="edit-description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="input"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn btn-secondary flex-1"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-border" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedGroup.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setShowMembersModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setShowAddMembersModal(true);
                      loadAvailableStudents();
                    }}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Members
                  </button>
                </div>

                {isLoadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="ml-2 text-muted-foreground">Loading members...</span>
                  </div>
                ) : groupMembers.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No members in this group yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{member.fullName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                        <button
                          onClick={() => setRemoveMemberConfirm(member)}
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Members Modal */}
        {showAddMembersModal && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-border" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Add Members to {selectedGroup.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setSelectedStudentIds(new Set());
                    setSearchQuery('');
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddMembers} className="flex-1 overflow-hidden flex flex-col">
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                  {/* Search Bar */}
                  <div className="sticky top-0 pb-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  {isLoadingStudents ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <span className="ml-2 text-muted-foreground">Loading students...</span>
                    </div>
                  ) : availableStudents.length === 0 ? (
                    <div className="text-center py-8 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                      <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">All students are already in this group</p>
                    </div>
                  ) : (
                    <>
                      {/* Select All Button */}
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <button
                          type="button"
                          onClick={toggleAllVisible}
                          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-2"
                        >
                          {availableStudents
                            .filter((student) => {
                              const query = searchQuery.toLowerCase();
                              return (
                                (student.fullName?.toLowerCase().includes(query) ?? false) ||
                                student.email.toLowerCase().includes(query)
                              );
                            })
                            .every((s) => selectedStudentIds.has(s.id)) ? (
                            <>
                              <CheckSquare className="w-4 h-4" />
                              Deselect All
                            </>
                          ) : (
                            <>
                              <Square className="w-4 h-4" />
                              Select All
                            </>
                          )}
                        </button>
                        <span className="text-sm text-muted-foreground">
                          {availableStudents.filter((s) => {
                            const query = searchQuery.toLowerCase();
                            return (
                              (s.fullName?.toLowerCase().includes(query) ?? false) || s.email.toLowerCase().includes(query)
                            );
                          }).length}{' '}
                          students available
                        </span>
                      </div>

                      {/* Student List */}
                      <div className="space-y-2">
                        {availableStudents
                          .filter((student) => {
                            const query = searchQuery.toLowerCase();
                            return (
                              (student.fullName?.toLowerCase().includes(query) ?? false) ||
                              student.email.toLowerCase().includes(query)
                            );
                          })
                          .map((student) => {
                            const isSelected = selectedStudentIds.has(student.id);
                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => toggleStudentSelection(student.id)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                                  isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-card hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-primary" />
                                  ) : (
                                    <Square className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground truncate">
                                    {student.fullName || <span className="text-muted-foreground italic">Pending Registration</span>}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate">{student.email}</div>
                                </div>
                              </button>
                            );
                          })}
                      </div>

                      {/* No Results */}
                      {searchQuery &&
                        availableStudents.filter((student) => {
                          const query = searchQuery.toLowerCase();
                          return (
                            (student.fullName?.toLowerCase().includes(query) ?? false) ||
                            student.email.toLowerCase().includes(query)
                          );
                        }).length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No students found matching "{searchQuery}"</p>
                          </div>
                        )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/50">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMembersModal(false);
                        setSelectedStudentIds(new Set());
                        setSearchQuery('');
                      }}
                      className="btn btn-secondary flex-1"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={isSaving || selectedStudentIds.size === 0}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add {selectedStudentIds.size} Member{selectedStudentIds.size !== 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Group Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteGroupConfirm}
          onClose={() => setDeleteGroupConfirm(null)}
          onConfirm={handleDeleteGroup}
          title="Delete Group"
          message={`Are you sure you want to delete "${deleteGroupConfirm?.name}"?\n\nThis will remove all member associations. This action cannot be undone.`}
          confirmText="Delete Group"
          variant="danger"
        />

        {/* Remove Member Confirmation Modal */}
        <ConfirmModal
          isOpen={!!removeMemberConfirm}
          onClose={() => setRemoveMemberConfirm(null)}
          onConfirm={handleRemoveMember}
          title="Remove Member"
          message={`Remove ${removeMemberConfirm?.fullName} (${removeMemberConfirm?.email}) from this group?`}
          confirmText="Remove Member"
          variant="danger"
        />
      </div>
    </AdminLayout>
  );
}
