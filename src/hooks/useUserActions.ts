import { api } from '../api';
import { User, CustomRole, Department } from '../types';

interface UseUserActionsParams {
  appUser: User | null;
  setAppUser: React.Dispatch<React.SetStateAction<User | null>>;
  fetchData: () => Promise<void>;
  t: (key: string) => string;
}

export function useUserActions({ appUser, setAppUser, fetchData, t }: UseUserActionsParams) {
  const handleInviteUser = async (email: string, role: User['role'], customPermissions?: string[]) => {
    try {
      await api.inviteUser(email, role, customPermissions);
      await api.createNotification({
        userId: appUser!.uid,
        title: 'User Invited',
        message: `Invitation sent to ${email} as ${role}`,
      });
      await fetchData();
    } catch (error) {
      console.error('Invite user error:', error);
    }
  };

  const handleUpdateUserRole = async (uid: string, role: User['role'], customPermissions?: string[]) => {
    try {
      await api.updateUserRole(uid, role, customPermissions);

      if (uid === appUser?.uid) {
        setAppUser(prev => prev ? { ...prev, role, customPermissions } : null);
      }

      await api.createNotification({
        userId: uid,
        title: t('userManagement'),
        message: `Your role has been updated to ${role}`,
      });
      await fetchData();
    } catch (error) {
      console.error('Update user role error:', error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      if (uid === appUser?.uid) return;
      await api.deleteUser(uid);
      await fetchData();
    } catch (error) {
      console.error('Delete user error:', error);
    }
  };

  const handleAddCustomRole = async (role: Omit<CustomRole, 'id'>) => {
    try {
      await api.createCustomRole(role);
      await fetchData();
    } catch (error) {
      console.error('Add custom role error:', error);
    }
  };

  const handleUpdateCustomRole = async (id: string, roleData: Partial<CustomRole>) => {
    try {
      await api.updateCustomRole(id, roleData);
      await fetchData();
    } catch (error) {
      console.error('Update custom role error:', error);
    }
  };

  const handleDeleteCustomRole = async (roleId: string) => {
    try {
      await api.deleteCustomRole(roleId);
      await fetchData();
    } catch (error) {
      console.error('Delete custom role error:', error);
    }
  };

  const handleAddDepartment = async (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.createDepartment(data);
      await fetchData();
      return { ok: true as const };
    } catch (error: any) {
      console.error('Add department error:', error);
      return { ok: false as const, error: error?.message || 'Failed' };
    }
  };

  const handleUpdateDepartment = async (id: string, data: Partial<Omit<Department, 'id'>>) => {
    try {
      await api.updateDepartment(id, data);
      await fetchData();
      return { ok: true as const };
    } catch (error: any) {
      console.error('Update department error:', error);
      return { ok: false as const, error: error?.message || 'Failed' };
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await api.deleteDepartment(id);
      await fetchData();
      return { ok: true as const };
    } catch (error: any) {
      console.error('Delete department error:', error);
      return { ok: false as const, error: error?.message || 'Failed' };
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await fetchData();
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const createNotification = async (userId: string | undefined, title: string, message: string, taskId?: string) => {
    if (!userId) return;
    try {
      await api.createNotification({ userId, title, message, taskId });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return {
    handleInviteUser,
    handleUpdateUserRole,
    handleDeleteUser,
    handleAddCustomRole,
    handleUpdateCustomRole,
    handleDeleteCustomRole,
    handleAddDepartment,
    handleUpdateDepartment,
    handleDeleteDepartment,
    handleMarkAllNotificationsAsRead,
    createNotification,
  };
}
