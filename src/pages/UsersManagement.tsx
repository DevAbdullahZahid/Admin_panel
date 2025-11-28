// src/pages/UsersManagement.tsx
import React, { useState, useEffect } from 'react';
import { AppUser, PortalUserRole } from '../types';
import AddUserModal from '../components/AddUserModal';
import { PlusIcon, TrashIcon } from '../components/icons';
import { useAuth } from '../hooks/useAuth';
import { logActivity } from '../utils/activityLogger';
import { apiFetch } from '../utils/apiService';

const getRoleLevel = (role: PortalUserRole | undefined): number => {
  switch (role) {
    case 'SuperAdmin': return 4;
    case 'Admin': return 3;
    case 'Editor': return 2;
    case 'User': return 1;
    default: return 0;
  }
};

interface UsersManagementProps {
  currentUserRole: PortalUserRole;
  currentUserId: string;
}

const UsersManagement: React.FC<UsersManagementProps> = ({
  currentUserRole,
  currentUserId,
}) => {
  /*  STATE  */
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | undefined>(undefined);

  const { currentUser } = useAuth();
  const currentUserLevel = getRoleLevel(currentUserRole);

  /* ----------------------- FETCH USERS ----------------------- */
  const extractUserList = (payload: any): AppUser[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    return [];
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/users', { method: 'GET' });
      const list = extractUserList(data);
      if (!Array.isArray(list)) {
        throw new Error('Unexpected response format from /users');
      }
      setUsers(list);
    } catch (err: any) {
      console.error('fetchUsers error:', err);
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Run once on mount

  /* SEARCH FILTER */
  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  /* ---------------------- SAVE USER ----------------------- */
  const handleSaveUser = async (payload: any, userId?: string): Promise<boolean> => {
    setError(null);
    setSuccess(null);
    try {
      const endpoint = userId ? `/users/${userId}` : 'auth/signup';
      const method = userId ? 'PUT' : 'POST';

      console.log(`Calling ${method} ${endpoint}`, payload);

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const action = userId ? 'updated' : 'created';
      logActivity(`${action} user '${payload.first_name} ${payload.last_name}'`, currentUser?.name || 'Admin');
      setSuccess(`User ${action} successfully!`);

      // RELOAD USERS
      await fetchUsers();

      setIsModalOpen(false);
      setEditingUser(undefined);
      return true;
    } catch (err: any) {
      console.error('handleSaveUser error:', err);
      const friendly = err.message.toLowerCase().includes('already exists')
        ? 'An account with this email already exists.'
        : err.message;
      setError(friendly);
      return false;
    }
  };

  /*  DELETE USER */
  const handleDeleteUser = async (user: AppUser) => {
    if (!window.confirm(`Delete "${user.firstName} ${user.lastName}"?`)) return;
    setError(null);
    setSuccess(null);

    if (user.id === currentUserId) {
      setError('You cannot delete your own account.');
      return;
    }

    const targetLevel = getRoleLevel(user.role as PortalUserRole);
    if (targetLevel >= currentUserLevel && currentUserRole !== 'SuperAdmin') {
      setError('You do not have permission to delete this user.');
      return;
    }

    try {
      await apiFetch(`/users/${user.id}`, { method: 'DELETE' });

      logActivity(`deleted user '${user.firstName} ${user.lastName}'`, currentUser?.name || 'Admin');
      setSuccess('User deleted successfully');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  /* EDIT HANDLER */
  const openEditModal = (user: AppUser) => {
    const targetLevel = getRoleLevel(user.role as PortalUserRole);
    const canEdit =
      user.id === currentUserId ||
      targetLevel < currentUserLevel ||
      currentUserRole === 'SuperAdmin';

    if (!canEdit) {
      setError('You do not have permission to edit this user.');
      return;
    }
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(undefined);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
          <p className="text-gray-500 mt-1">Create, edit and delete portal users.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New User
        </button>
      </div>

      {/* TOASTS */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="font-bold">×</button>
        </div>
      )}

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-500">
                {searchQuery ? 'No users match your search.' : 'No users found.'}
              </td></tr>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                const targetLevel = getRoleLevel(user.role as PortalUserRole);
                const canEdit = isSelf || targetLevel < currentUserLevel || currentUserRole === 'SuperAdmin';
                const canDelete = !isSelf && (targetLevel < currentUserLevel || currentUserRole === 'SuperAdmin');

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName} {isSelf && '(You)'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${user.role === 'SuperAdmin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'Admin'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'Editor'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm">{user.referralCode || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {user.discountAmount ? `${user.discountAmount}%` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => openEditModal(user)}
                        disabled={!canEdit}
                        className={`mr-3 ${canEdit ? 'text-indigo-600 hover:text-indigo-900' : 'text-gray-400 cursor-not-allowed'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={!canDelete}
                        className={canDelete ? 'text-red-600 hover:text-red-800' : 'text-gray-400 cursor-not-allowed'}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <AddUserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingUser={editingUser}
        onAddUser={handleSaveUser}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default UsersManagement;