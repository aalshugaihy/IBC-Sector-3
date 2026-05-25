import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { User, Task, Report, Notification, CustomRole, Department, Committee } from '../types';

const POLL_INTERVAL = 5000;

export function useData(appUser: User | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);

  const fetchData = useCallback(async () => {
    if (!appUser) return;
    try {
      const [tasksData, usersData, reportsData, notificationsData, rolesData, deptsData, committeesData] = await Promise.all([
        api.listTasks(),
        api.listUsers(),
        api.listReports(),
        api.listNotifications(),
        api.listCustomRoles(),
        api.listDepartments(),
        api.listCommittees(),
      ]);
      setTasks(tasksData);
      setUsers(usersData);
      setReports(reportsData);
      setNotifications(notificationsData);
      setCustomRoles(rolesData);
      setDepartments(deptsData);
      setCommittees(committeesData);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [appUser]);

  // Initial fetch + polling
  useEffect(() => {
    if (!appUser) return;
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [appUser, fetchData]);

  const clearData = useCallback(() => {
    setTasks([]);
    setUsers([]);
    setReports([]);
    setNotifications([]);
    setCustomRoles([]);
    setDepartments([]);
    setCommittees([]);
  }, []);

  return {
    tasks,
    users,
    reports,
    setReports,
    notifications,
    customRoles,
    departments,
    committees,
    fetchData,
    clearData,
  };
}
