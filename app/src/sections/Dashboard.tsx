import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  Package,
  MessageSquare,
  Users,
  Activity,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
  User,
  BarChart3,
  Shield,
  HelpCircle,
  ScrollText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, useThemeStore, useUIStore, useBotStore, useTaskPackStore, useChannelStore, useActivityStore, useNotificationStore } from '@/store';
import BotsPanel from '@/sections/BotsPanel';
import TaskPackPanel from '@/sections/TaskPackPanel';
import ChannelPanel from '@/sections/ChannelPanel';
import FamilyPanel from '@/sections/FamilyPanel';
import ActivityPanel from '@/sections/ActivityPanel';
import SettingsPanel from '@/sections/SettingsPanel';
import AnalyticsPanel from '@/sections/AnalyticsPanel';
import BotCreationWizard from '@/components/BotCreationWizard';
import ApprovalWorkflow from '@/components/ApprovalWorkflow';
import HelpDocumentation from '@/components/HelpDocumentation';
import ExecutionLogs from '@/components/ExecutionLogs';

const navItems: { id: string; label: string; icon: any; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bots', label: 'Bots', icon: Bot },
  { id: 'packs', label: 'Task Packs', icon: Package },
  { id: 'channels', label: 'Channels', icon: MessageSquare },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'approvals', label: 'Approvals', icon: Shield },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { sidebarCollapsed, toggleSidebar, activePanel, setActivePanel } = useUIStore();
  const { bots, fetchBots } = useBotStore();
  const { packs, fetchPacks } = useTaskPackStore();
  const { channels, fetchChannels } = useChannelStore();
  const { activities, fetchActivities } = useActivityStore();
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [approvalWorkflowOpen, setApprovalWorkflowOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [executionLogsOpen, setExecutionLogsOpen] = useState(false);

  useEffect(() => {
    fetchBots();
    fetchPacks();
    fetchChannels();
    fetchActivities();
  }, []);

  const activeBots = bots.filter(b => b.status === 'active').length;
  const enabledPacks = packs.filter(p => p.enabled).length;
  const connectedChannels = channels.filter(c => c.status === 'connected').length;
  const totalExecutions = bots.reduce((sum, b) => sum + b.metrics.totalExecutions, 0);

  const renderPanel = () => {
    switch (activePanel) {
      case 'bots':
        return <BotsPanel />;
      case 'packs':
        return <TaskPackPanel />;
      case 'channels':
        return <ChannelPanel />;
      case 'family':
        return <FamilyPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'approvals':
        return <DashboardHome showApprovals={true} />;
      case 'activity':
        return <ActivityPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardHome />;
    }
  };

  function DashboardHome({ showApprovals = false }: { showApprovals?: boolean }) {
    // Only open approval workflow once when navigating to approvals panel
    useEffect(() => {
      if (showApprovals && !approvalWorkflowOpen) {
        setApprovalWorkflowOpen(true);
        // Switch to dashboard after opening the modal so we don't keep triggering
        setActivePanel('dashboard');
      }
    }, [showApprovals]);

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] p-6 sm:p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium">
                Welcome back
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
              {`${getGreeting()}, ${user?.name || 'User'}`}
            </h1>
            <p className="text-white/70 max-w-xl">
              Your AI assistants are running smoothly. Here is what is happening today.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </motion.div>


        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Active Bots',
              value: activeBots,
              total: bots.length,
              icon: Bot,
              color: 'text-blue-500',
              bgColor: 'bg-blue-500/10'
            },
            {
              label: 'Task Packs',
              value: enabledPacks,
              total: packs.length,
              icon: Package,
              color: 'text-emerald-500',
              bgColor: 'bg-emerald-500/10'
            },
            {
              label: 'Channels',
              value: connectedChannels,
              total: channels.length,
              icon: MessageSquare,
              color: 'text-violet-500',
              bgColor: 'bg-violet-500/10'
            },
            {
              label: 'Executions',
              value: totalExecutions.toLocaleString(),
              icon: Zap,
              color: 'text-amber-500',
              bgColor: 'bg-amber-500/10'
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.total !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    of {stat.total}
                  </span>
                )}
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bot Status */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Bot Status</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel('bots')}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bots.slice(0, 4).map((bot) => (
                <div
                  key={bot.id}
                  className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all group cursor-pointer"
                  onClick={() => setActivePanel('bots')}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={bot.avatar}
                      alt={bot.name}
                      className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-foreground">{bot.name}</span>
                        <span className={`w-2 h-2 rounded-full ${bot.status === 'active' ? 'bg-emerald-500' :
                          bot.status === 'deploying' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                          }`} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{bot.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {bot.metrics.totalExecutions}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {bot.metrics.uptime}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel('activity')}
              >
                View All
              </Button>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 divide-y divide-border/50">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="p-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.status === 'success' ? 'bg-emerald-500/10' :
                    activity.status === 'failure' ? 'bg-red-500/10' : 'bg-amber-500/10'
                    }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : activity.status === 'failure' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
            <Button variant="outline" onClick={() => setActivePanel('channels')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Connect Channel
            </Button>
            <Button variant="outline" onClick={() => setActivePanel('packs')}>
              <Package className="w-4 h-4 mr-2" />
              Enable Task Pack
            </Button>
            <Button variant="outline" onClick={() => setActivePanel('family')}>
              <Users className="w-4 h-4 mr-2" />
              Invite Family
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-display font-bold text-foreground">Clawd</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activePanel === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-display font-bold text-foreground">Clawd</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePanel(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activePanel === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-foreground">Clawd</span>
              <ChevronRight className="w-4 h-4" />
              <span className="capitalize">{activePanel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64 bg-muted border-0"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-foreground" />
              )}
            </button>

            {/* Execution Logs */}
            <button
              onClick={() => setExecutionLogsOpen(true)}
              className="hidden sm:flex p-2 rounded-lg hover:bg-muted transition-colors"
              title="Execution Logs"
            >
              <ScrollText className="w-5 h-5 text-foreground" />
            </button>

            {/* Help */}
            <button
              onClick={() => setHelpOpen(true)}
              className="hidden sm:flex p-2 rounded-lg hover:bg-muted transition-colors"
              title="Help & Documentation"
            >
              <HelpCircle className="w-5 h-5 text-foreground" />
            </button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                  <Bell className="w-5 h-5 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3">
                      <span className="font-medium text-sm text-foreground">{notif.title}</span>
                      <span className="text-xs text-muted-foreground">{notif.message}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] text-white text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-foreground">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActivePanel('settings')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActivePanel('settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bot Creation Wizard */}
      <BotCreationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Approval Workflow */}
      <ApprovalWorkflow
        isOpen={approvalWorkflowOpen}
        onClose={() => {
          setApprovalWorkflowOpen(false);
        }}
      />

      {/* Help Documentation */}
      <HelpDocumentation
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* Execution Logs */}
      <ExecutionLogs
        isOpen={executionLogsOpen}
        onClose={() => setExecutionLogsOpen(false)}
      />
    </div>
  );
}
