// src/components/AddUserModal.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { PortalUserRole } from '../types';

interface UserFormInputs {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: PortalUserRole;
  referralCode?: string;
  discountAmount?: number;
  isActive?: boolean;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: any;
  onAddUser: (payload: any, userId?: string) => Promise<boolean>;
  currentUserRole: PortalUserRole;
  currentUserId: string;
}

/* --------------------------------------------------------------- */
const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  onAddUser,
  currentUserRole,
  currentUserId,
}) => {
  const isEditing = !!editingUser;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormInputs>({
    defaultValues: isEditing
      ? {
          email: editingUser.email,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          role: editingUser.role,
          referralCode: editingUser.referralCode,
          discountAmount: editingUser.discountAmount,
          isActive: editingUser.isActive,
        }
      : {},
  });

  /* ---------- LOCAL UI STATE ---------- */
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);   // <-- FIXED
  /* ------------------------------------ */

  /* ---------- FORM SUBMIT ---------- */
  const onSubmit: SubmitHandler<UserFormInputs> = async (data) => {
    setSubmissionError(null);
    setIsSubmitting(true);                                   // <-- FIXED

    try {
      // ---- BUILD PAYLOAD EXACTLY LIKE YOUR BACKEND ----
      const payload: any = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role.toLowerCase(),
        plan: 'free',
      };

      if (data.referralCode) payload.referred_by_referral_code = data.referralCode;
      if (data.discountAmount && data.discountAmount > 0) payload.discount_amount = data.discountAmount;
      if (isEditing && data.isActive !== undefined) payload.is_active = data.isActive;

      console.log('AddUserModal → payload:', payload);   // DEBUG

      // ---- CALL PARENT (UsersManagement) ----
      const saved = await onAddUser(payload, isEditing ? editingUser.id : undefined);
      if (saved) {
        reset();
        onClose();
      }
    } catch (err: any) {
      console.error('AddUserModal error:', err);
      const msg = err.message.toLowerCase().includes('already exists')
        ? 'An account with this email already exists.'
        : err.message;
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);                           // <-- FIXED
    }
  };
  /* --------------------------------- */

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? 'Edit User' : 'Add New User'}
        </h2>

        {/* ---------- ERROR TOAST ---------- */}
        {submissionError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex justify-between">
            <span>{submissionError}</span>
            <button onClick={() => setSubmissionError(null)} className="font-bold">
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              disabled={isEditing}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* PASSWORD (only for new users) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}

          {/* FIRST NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              {...register('firstName', { required: 'First name is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>

          {/* LAST NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              {...register('lastName', { required: 'Last name is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>

          {/* ROLE */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="User">User</option>
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
          </div>

          {/* REFERRAL CODE (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Referral Code (optional)</label>
            <input
              {...register('referralCode')}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          {/* DISCOUNT (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount % (optional)</label>
            <input
              {...register('discountAmount', { valueAsNumber: true })}
              type="number"
              min="0"
              max="100"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          {/* ACTIVE STATUS (only on edit) */}
          {isEditing && (
            <div className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Active</label>
            </div>
          )}

          {/* ---------- BUTTONS ---------- */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;