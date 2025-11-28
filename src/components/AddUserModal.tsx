// src/components/AddUserModal.tsx
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { PortalUserRole } from '../types';

interface UserFormInputs {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: PortalUserRole;
  referralCode?: string;
  discountAmount?: number;
  isActive?: boolean;
  otp: string;
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
    setValue,
    formState: { errors },
  } = useForm<UserFormInputs>({
    defaultValues: {}, // We'll set them in useEffect
  });

  /* ---------- LOCAL UI STATE ---------- */
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* ------------------------------------ */

  /* ---------- SYNC DEFAULT VALUES WHEN EDITING ---------- */
  useEffect(() => {
    if (isEditing && editingUser) {
      setValue('email', editingUser.email || '');
      setValue('firstName', editingUser.firstName || '');
      setValue('lastName', editingUser.lastName || '');
      setValue('role', editingUser.role || 'User');
      setValue('referralCode', editingUser.referralCode || '');
      setValue('discountAmount', editingUser.discountAmount || undefined);
      setValue('isActive', editingUser.isActive ?? true);
      // Don't set OTP when editing
    } else {
      reset({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'User',
        referralCode: '',
        discountAmount: undefined,
        isActive: true,
        otp: '',
      });
    }
  }, [isEditing, editingUser, setValue, reset]);
  /* ----------------------------------------------------- */

  /* ---------- FORM SUBMIT ---------- */
  const onSubmit: SubmitHandler<UserFormInputs> = async (data) => {
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      // ---- BUILD PAYLOAD EXACTLY LIKE BACKEND EXPECTS ----
      const payload: any = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role.toLowerCase(),
        plan: 'free',
        otp: data.otp,
      };

      // Only send password for new users
      if (!isEditing && data.password) {
        payload.password = data.password;
      }

      // Optional fields
      if (data.referralCode) {
        payload.referred_by_referral_code = data.referralCode;
      }
      if (data.discountAmount !== undefined && data.discountAmount > 0) {
        payload.discount_amount = data.discountAmount;
      }
      if (isEditing && data.isActive !== undefined) {
        payload.is_active = data.isActive;
      }

      console.log('AddUserModal → Sending payload:', payload);

      const saved = await onAddUser(payload, isEditing ? editingUser.id : undefined);
      if (saved) {
        reset();
        onClose();
      }
    } catch (err: any) {
      console.error('AddUserModal error:', err);
      const msg = err.message?.toLowerCase().includes('already exists')
        ? 'An account with this email already exists.'
        : err.message || 'Failed to save user';
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);
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
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isEditing}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* PASSWORD (only for new users) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>

          {/* LAST NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              {...register('lastName', { required: 'Last name is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>

          {/* ROLE */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a role</option>
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
              placeholder="e.g. ABC123"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* DISCOUNT % (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount % (optional)</label>
            <input
              {...register('discountAmount', {
                valueAsNumber: true,
                min: { value: 0, message: 'Cannot be negative' },
                max: { value: 100, message: 'Cannot exceed 100%' }
              })}
              type="number"
              min="0"
              max="100"
              placeholder="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.discountAmount && <p className="text-red-500 text-xs mt-1">{errors.discountAmount.message}</p>}
          </div>

          {/* ACTIVE STATUS (only on edit) */}
          {isEditing && (
            <div className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">User is active</label>
            </div>
          )}

          {/* OTP (only for new users) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700">OTP</label>
              <input
                {...register('otp', {
                  required: 'OTP is required',
                  minLength: { value: 4, message: 'OTP must be at least 4 digits' }
                })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p>}
            </div>
          )}

          {/* ---------- BUTTONS ---------- */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;