import { useState } from 'react';
import { api } from '../api';
import { Task } from '../types';
import { INITIAL_TASKS } from '../constants';

interface UseTaskActionsParams {
  fetchData: () => Promise<void>;
  tasks: Task[];
  t: (key: string) => string;
  appUser: { role: string; uid: string } | null;
  createNotification: (userId: string | undefined, title: string, message: string, taskId?: string) => Promise<void>;
}

export function useTaskActions({ fetchData, tasks, t, appUser, createNotification }: UseTaskActionsParams) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<'view' | 'edit' | 'add'>('edit');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [historyTask, setHistoryTask] = useState<Task | null>(null);

  const handleUpdateTask = async (task: Task) => {
    try {
      const { id, history, createdAt, updatedAt, ...data } = task;
      if (!id) return;

      await api.updateTask(id, data);

      const oldTask = tasks.find(t => t.id === id);
      if (data.assignedTo && data.assignedTo !== oldTask?.assignedTo) {
        createNotification(data.assignedTo, t('tasks'), `${t('editEvent')}: ${data.title}`, id);
      }
      if (data.teamMembers && oldTask) {
        const newMembers = data.teamMembers.filter(m => !oldTask?.teamMembers?.some(om => om.userId === m.userId));
        newMembers.forEach(member => {
          createNotification(member.userId, t('teamMembers'), `${t('addEvent')}: ${data.title}`, id);
        });
      }

      await fetchData();
    } catch (error) {
      console.error('Update task error:', error);
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    try {
      const created = await api.createTask(task);

      if (task.assignedTo) {
        createNotification(task.assignedTo, t('tasks'), `${t('addEvent')}: ${task.title}`, created.id);
      }
      if (task.teamMembers) {
        task.teamMembers.forEach(member => {
          createNotification(member.userId, t('teamMembers'), `${t('addEvent')}: ${task.title}`, created.id);
        });
      }

      setIsTaskModalOpen(false);
      setEditingTask(null);
      await fetchData();
    } catch (error) {
      console.error('Add task error:', error);
    }
  };

  const handleSaveTask = (taskData: Omit<Task, 'id'> | Task) => {
    if ('id' in taskData) {
      handleUpdateTask(taskData as Task);
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } else {
      handleAddTask(taskData);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      await fetchData();
    } catch (error) {
      console.error('Delete task error:', error);
    }
  };

  const handleBulkUpdate = async (taskIds: string[], updates: Partial<Task>) => {
    try {
      await api.bulkUpdateTasks(taskIds, updates);
      await fetchData();
    } catch (error) {
      console.error('Bulk update error:', error);
    }
  };

  const handleBulkDelete = async (taskIds: string[]) => {
    try {
      await api.bulkDeleteTasks(taskIds);
      await fetchData();
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleResetTasks = async () => {
    if (appUser?.role !== 'admin') return;
    try {
      await api.resetTasks(INITIAL_TASKS);
      await fetchData();
      console.log(t('syncSuccess'));
    } catch (error) {
      console.error('Reset tasks error:', error);
    }
  };

  const handleSyncInitialTasks = async () => {
    if (appUser?.role !== 'admin') return;
    if (window.confirm(t('confirmResetTasks'))) {
      await handleResetTasks();
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskModalMode('edit');
    setIsTaskModalOpen(true);
  };

  const openViewModal = (task: Task) => {
    setEditingTask(task);
    setTaskModalMode('view');
    setIsTaskModalOpen(true);
  };

  const openHistoryModal = (task: Task) => {
    setHistoryTask(task);
    setIsHistoryModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTaskModalMode('add');
    setIsTaskModalOpen(true);
  };

  return {
    isTaskModalOpen,
    setIsTaskModalOpen,
    taskModalMode,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    editingTask,
    historyTask,
    handleUpdateTask,
    handleAddTask,
    handleSaveTask,
    handleDeleteTask,
    handleBulkUpdate,
    handleBulkDelete,
    handleResetTasks,
    handleSyncInitialTasks,
    openEditModal,
    openViewModal,
    openHistoryModal,
    openAddModal,
  };
}
