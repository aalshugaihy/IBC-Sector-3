import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { useTaskActions } from './hooks/useTaskActions';
import { useUserActions } from './hooks/useUserActions';
import { useCommitteeActions } from './hooks/useCommitteeActions';
import { Dashboard } from './components/Dashboard';
import { CommitteeManagement } from './components/CommitteeManagement';
import { TaskList } from './components/TaskList';
import { ReportGenerator } from './components/ReportGenerator';
import { SectorCalendar } from './components/SectorCalendar';
import { Chatbot } from './components/Chatbot';
import { UserManagement } from './components/UserManagement';
import { MyTasks } from './components/MyTasks';
import { NotificationCenter } from './components/NotificationCenter';
import { Footer } from './components/Footer';
import { TaskModal } from './components/TaskModal';
import { TaskHistoryModal } from './components/TaskHistoryModal';
import { INITIAL_TASKS } from './constants';
import {
  LayoutDashboard, ListTodo, FileText, LogOut, User as UserIcon,
  Loader2, BarChart3, Columns, Users, Moon, Sun, Globe, Plus,
  Calendar as CalendarIcon, AlertCircle, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const TAB_ROUTES = [
  { path: '/calendar', icon: <CalendarIcon size={16} />, labelKey: 'sectorCalendar' },
  { path: '/dashboard', icon: <LayoutDashboard size={16} />, labelKey: 'dashboard' },
  { path: '/tasks', icon: <ListTodo size={16} />, labelKey: 'tasks' },
  { path: '/kanban', icon: <Columns size={16} />, labelKey: 'kanban' },
  { path: '/committees', icon: <Briefcase size={16} />, labelKey: 'committees' },
  { path: '/my-tasks', icon: <UserIcon size={16} />, labelKey: 'myTasks' },
  { path: '/reports', icon: <FileText size={16} />, labelKey: 'reports' },
];

const ADMIN_TAB = { path: '/users', icon: <Users size={16} />, labelKey: 'userManagement' };

function AppLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    appUser, setAppUser, loading, darkMode, toggleDarkMode, toggleLanguage,
    authMode, setAuthMode, authEmail, setAuthEmail, authPassword, setAuthPassword,
    authName, setAuthName, authError, setAuthError, authLoading,
    handleLogin, handleRegister, handleLogout: authLogout,
  } = useAuth();

  const { tasks, users, reports, setReports, notifications, customRoles, departments, committees, fetchData, clearData } = useData(appUser);

  const {
    handleInviteUser, handleUpdateUserRole, handleDeleteUser,
    handleAddCustomRole, handleUpdateCustomRole, handleDeleteCustomRole,
    handleAddDepartment, handleUpdateDepartment, handleDeleteDepartment,
    handleMarkAllNotificationsAsRead, createNotification,
  } = useUserActions({ appUser, setAppUser, fetchData, t });

  const {
    handleAddCommittee, handleUpdateCommittee, handleDeleteCommittee,
    handleAddCommitteeMember, handleRemoveCommitteeMember, handleImportCommittees,
  } = useCommitteeActions({ fetchData, t });

  const {
    isTaskModalOpen, setIsTaskModalOpen, taskModalMode,
    isHistoryModalOpen, setIsHistoryModalOpen, editingTask, historyTask,
    handleUpdateTask, handleAddTask, handleSaveTask, handleDeleteTask,
    handleBulkUpdate, handleBulkDelete, handleResetTasks, handleSyncInitialTasks,
    openEditModal, openViewModal, openHistoryModal, openAddModal,
  } = useTaskActions({ fetchData, tasks, t, appUser, createNotification });

  const handleLogout = () => {
    authLogout();
    clearData();
  };

  // Derive activeTab from current route for the nav highlight
  const activeTab = '/' + (location.pathname.split('/')[1] || 'dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app noise-overlay">
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl glass-1 flex items-center justify-center">
            <div className="w-14 h-14 border-2 border-primary/15 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="text-primary animate-pulse" size={22} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!appUser) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-app p-6 noise-overlay relative ${i18n.language === 'ar' ? 'font-arabic' : ''}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="aurora-bg" />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-primary/5 text-center relative overflow-hidden z-10"
        >
          {/* Gradient accent line at top */}
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-t-2xl" />

          <div className="p-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="relative w-14 h-14 mx-auto mb-4"
            >
              <div className="relative w-full h-full bg-gradient-to-br from-primary via-primary-dark to-accent rounded-xl flex items-center justify-center shadow-2xl">
                <BarChart3 className="text-white" size={26} strokeWidth={2.5} />
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('innovationHub')}</h1>
            <p className="text-slate-600 dark:text-slate-500 font-medium text-xs mb-1">
              {t('sectorName')}
            </p>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mb-7">
              {authMode === 'login' ? t('signIn') : t('createAccount')}
            </p>

            <AnimatePresence mode="wait">
              {authError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm font-semibold"
                >
                  {authError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3 text-left">
              <AnimatePresence>
                {authMode === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder={t('fullName')}
                      className="w-full bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all duration-300"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder={t('email')}
                required
                className="w-full bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all duration-300"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={t('password')}
                required
                minLength={6}
                className="w-full bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all duration-300"
              />
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-primary-dark to-accent text-white px-6 py-3 rounded-xl shadow-lg shadow-primary/25 font-medium text-sm disabled:opacity-50 mt-4 transition-all duration-300"
              >
                {authLoading ? <Loader2 size={22} className="animate-spin" /> : <UserIcon size={22} strokeWidth={2} />}
                <span>{authMode === 'login' ? t('signIn') : t('createAccount')}</span>
              </motion.button>
            </form>

            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              className="mt-4 text-sm text-primary hover:text-accent font-semibold transition-colors duration-300"
            >
              {authMode === 'login' ? t('noAccount') : t('hasAccount')}
            </button>

            <div className="mt-6 flex justify-center items-center gap-4">
              <button onClick={toggleLanguage} className="text-xs text-slate-500 dark:text-slate-500 font-semibold flex items-center gap-1.5 hover:text-primary transition-colors duration-300">
                <Globe size={14} />
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </button>
              <button onClick={toggleDarkMode} className="text-xs text-slate-500 dark:text-slate-500 font-semibold flex items-center gap-1.5 hover:text-primary transition-colors duration-300" title={darkMode ? t('lightMode') : t('darkMode')}>
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                {darkMode ? t('lightMode') : t('darkMode')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isRTL = i18n.language === 'ar';
  const tabs = [...TAB_ROUTES, ...(appUser?.role === 'admin' ? [ADMIN_TAB] : [])];

  // Derive page title key from route
  const pageTitleKey = activeTab === '/my-tasks' ? 'myTasks' : activeTab === '/users' ? 'userManagement' : activeTab.slice(1) || 'dashboard';

  return (
    <div className={`min-h-screen bg-app font-sans overflow-hidden relative flex flex-col noise-overlay ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="aurora-bg" />

      {/* Top Navigation Bar */}
      <header className={`w-full bg-white/80 dark:bg-navy/80 backdrop-blur-xl z-50 relative no-export border-b border-slate-200 dark:border-slate-800 ${isRTL ? 'font-arabic' : ''}`}>
        {/* Top row: Logo + User controls */}
        <div className="flex items-center justify-between px-6 py-2.5">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <motion.div whileHover={{ scale: 1.05, rotate: 3 }} className="relative w-9 h-9">
              <div className="relative w-full h-full bg-gradient-to-br from-primary via-primary-dark to-accent rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white" size={18} strokeWidth={2.5} />
              </div>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{t('innovationHub')}</span>
            </div>
          </div>

          {/* Right side: controls */}
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleDarkMode} title={darkMode ? t('lightMode') : t('darkMode')} className="flex items-center justify-center p-2 rounded-lg glass-1 text-primary hover:primary-glow transition-all duration-300 text-xs font-semibold">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleLanguage} title={isRTL ? 'English' : 'العربية'} className="flex items-center justify-center p-2 rounded-lg glass-1 text-primary hover:primary-glow transition-all duration-300 text-xs font-semibold">
              <Globe size={16} />
            </motion.button>
            <div className="flex items-center justify-center">
              <NotificationCenter notifications={notifications} onMarkAllAsRead={handleMarkAllNotificationsAsRead} />
            </div>

            {/* User info */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-1 mx-2">
              <img src={appUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(appUser?.displayName || '')}&background=6366f1&color=fff`} alt="" className="w-7 h-7 rounded-lg shadow-sm ring-1 ring-primary/20" />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{appUser?.displayName}</p>
                <p className="text-xs text-primary font-medium">{appUser?.role}</p>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleLogout} className="flex items-center gap-1.5 text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-all duration-300 font-semibold text-xs border border-rose-200/50 dark:border-rose-500/10">
              <LogOut size={14} />
              <span className="hidden sm:inline">{t('logout')}</span>
            </motion.button>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 px-6 pb-3 overflow-x-auto custom-scrollbar border-t border-slate-100 dark:border-slate-800/50 pt-2">
          {tabs.map((item) => (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap relative ${
                activeTab === item.path
                  ? 'text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-primary'
              }`}
            >
              {activeTab === item.path && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.icon}</span>
              <span className="relative z-10 text-sm font-medium">{t(item.labelKey)}</span>
            </motion.button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6 overflow-y-auto relative custom-scrollbar z-10"><div className="max-w-[1600px] mx-auto">
        {/* Floating Quick Action Button */}
        <div className={`fixed bottom-8 ${isRTL ? 'left-8' : 'right-8'} z-50 no-export`}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openAddModal} className="w-11 h-11 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center transition-colors">
            <Plus size={22} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Page Header */}
        <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t(pageTitleKey)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('sectorName')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="glass-1 rounded-lg px-3 py-2 flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">{tasks.length}</span>
              <span className="text-xs text-slate-400">{t('totalTasks')}</span>
              {appUser?.role === 'admin' && tasks.length !== INITIAL_TASKS.length && (
                <button onClick={handleSyncInitialTasks} className="text-primary hover:text-primary-dark ml-1" title={t('syncWithSchedule')}>
                  <AlertCircle size={14} />
                </button>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard tasks={tasks} committees={committees} isAdmin={appUser?.role === 'admin'} onResetTasks={handleResetTasks} />} />
              <Route path="/tasks" element={
                <TaskList
                  tasks={tasks}
                  users={users}
                  currentUser={appUser}
                  departments={departments}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  onBulkUpdate={handleBulkUpdate}
                  onBulkDelete={handleBulkDelete}
                  onSyncInitialTasks={handleSyncInitialTasks}
                  onEditTask={openEditModal}
                  onViewTask={openViewModal}
                  onOpenHistory={openHistoryModal}
                  onOpenAddModal={openAddModal}
                />
              } />
              <Route path="/kanban" element={
                <TaskList
                  tasks={tasks}
                  users={users}
                  currentUser={appUser}
                  departments={departments}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  onBulkUpdate={handleBulkUpdate}
                  onBulkDelete={handleBulkDelete}
                  onSyncInitialTasks={handleSyncInitialTasks}
                  onEditTask={openEditModal}
                  onViewTask={openViewModal}
                  onOpenHistory={openHistoryModal}
                  onOpenAddModal={openAddModal}
                  defaultView="kanban"
                />
              } />
              <Route path="/calendar" element={
                <SectorCalendar
                  tasks={tasks}
                  users={users}
                  onTaskClick={openViewModal}
                  onOpenAddModal={openAddModal}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onSaveTask={handleAddTask}
                />
              } />
              <Route path="/committees" element={
                <CommitteeManagement
                  committees={committees}
                  tasks={tasks}
                  departments={departments}
                  onAddCommittee={handleAddCommittee}
                  onUpdateCommittee={handleUpdateCommittee}
                  onDeleteCommittee={handleDeleteCommittee}
                  onAddCommitteeMember={handleAddCommitteeMember}
                  onRemoveCommitteeMember={handleRemoveCommitteeMember}
                  onImportCommittees={handleImportCommittees}
                />
              } />
              <Route path="/my-tasks" element={
                <MyTasks
                  tasks={tasks}
                  currentUser={appUser}
                  onUpdateTask={handleUpdateTask}
                  users={users}
                />
              } />
              <Route path="/reports" element={
                <ReportGenerator
                  tasks={tasks}
                  onReportSaved={(report) => setReports([...reports, report])}
                />
              } />
              <Route path="/users" element={
                appUser?.role === 'admin'
                  ? <UserManagement
                      users={users}
                      currentUser={appUser}
                      customRoles={customRoles}
                      departments={departments}
                      onInviteUser={handleInviteUser}
                      onUpdateUserRole={handleUpdateUserRole}
                      onDeleteUser={handleDeleteUser}
                      onAddCustomRole={handleAddCustomRole}
                      onUpdateCustomRole={handleUpdateCustomRole}
                      onDeleteCustomRole={handleDeleteCustomRole}
                      onAddDepartment={handleAddDepartment}
                      onUpdateDepartment={handleUpdateDepartment}
                      onDeleteDepartment={handleDeleteDepartment}
                    />
                  : <Navigate to="/dashboard" replace />
              } />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>

        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          task={editingTask}
          users={users}
          tasks={tasks}
          departments={departments}
          committees={committees}
          initialMode={taskModalMode}
        />

        <TaskHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          task={historyTask}
          users={users}
        />

        <Chatbot tasks={tasks} />
        <Footer />
      </div></main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
