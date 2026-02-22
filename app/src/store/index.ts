import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Bot,
  TaskPack,
  Channel,
  User,
  Family,
  FamilyMember,
  Activity,
  Notification,
  Theme,
  OnboardingState
} from '@/types';
import { authService } from '@/services';
import { clearAuthToken, api } from '@/services/api';

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          if (response.success && response.data.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }
          set({ isLoading: false, error: 'Login failed' });
          return false;
        } catch (e) {
          const error = e instanceof Error ? e.message : 'Login failed';
          set({ isLoading: false, error });
          return false;
        }
      },
      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.signup({ name, email, password });
          if (response.success && response.data.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }
          set({ isLoading: false, error: 'Signup failed' });
          return false;
        } catch (e) {
          const error = e instanceof Error ? e.message : 'Signup failed';
          set({ isLoading: false, error });
          return false;
        }
      },
      logout: () => {
        clearAuthToken();
        set({ user: null, isAuthenticated: false, error: null });
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      checkAuth: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            set({ user: response.data, isAuthenticated: true });
          } else {
            clearAuthToken();
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          clearAuthToken();
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'clawd-auth',
    }
  )
);

// Theme Store
interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),
    }),
    {
      name: 'clawd-theme',
    }
  )
);

// Bot Store
interface BotState {
  bots: Bot[];
  selectedBot: Bot | null;
  isLoading: boolean;
  fetchBots: () => Promise<void>;
  createBot: (bot: Record<string, any>) => Promise<Bot>;
  updateBot: (id: string, updates: Record<string, any>) => void;
  deleteBot: (id: string) => void;
  selectBot: (bot: Bot | null) => void;
  toggleBotStatus: (id: string) => void;
  assignPack: (botId: string, packId: string) => void;
  unassignPack: (botId: string, packId: string) => void;
}

export const useBotStore = create<BotState>()(
  persist(
    (set, _get) => ({
      bots: [],
      selectedBot: null,
      isLoading: false,
      fetchBots: async () => {
        set({ isLoading: true });
        try {
          const response = await api.getBots();
          if (response.success && response.data && Array.isArray(response.data.data)) {
            set({ bots: response.data.data, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch bots:', error);
          set({ isLoading: false });
        }
      },
      createBot: async (botData) => {
        try {
          const response = await api.createBot(botData);
          if (response.success && response.data) {
            const newBot = response.data;
            set((state) => ({ bots: [newBot, ...state.bots] }));
            return newBot;
          }
          throw new Error(response.error || 'Failed to create bot');
        } catch (error) {
          console.error('Create bot error:', error);
          throw error;
        }
      },
      updateBot: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          bots: state.bots.map(bot =>
            bot.id === id ? { ...bot, ...updates, updatedAt: new Date() } : bot
          ),
        }));
        try {
          await api.updateBot(id, updates);
        } catch (error) {
          console.error('Update bot error:', error);
          // Revert or show error? For now just log.
        }
      },
      deleteBot: async (id) => {
        set((state) => ({
          bots: state.bots.filter(bot => bot.id !== id),
          selectedBot: state.selectedBot?.id === id ? null : state.selectedBot,
        }));
        try {
          await api.deleteBot(id);
        } catch (error) {
          console.error('Delete bot error:', error);
        }
      },
      selectBot: (bot) => {
        set({ selectedBot: bot });
      },
      toggleBotStatus: async (id) => {
        const bot = _get().bots.find(b => b.id === id);
        if (!bot) return;

        // Optimistic
        const newStatus = bot.status === 'active' ? 'inactive' : 'active';
        set((state) => ({
          bots: state.bots.map(b => b.id === id ? { ...b, status: newStatus } : b)
        }));

        try {
          if (newStatus === 'active') {
            await api.startBot(id); // or deploy? startBot implies existing deployed bot?
            // Backend has start/stop/deploy. 
            // deploy sets status='active'.
            // start sets status='active'.
            // stop sets status='inactive'.
          } else {
            await api.stopBot(id);
          }
        } catch (error) {
          console.error('Toggle status error:', error);
          // Revert
          set((state) => ({
            bots: state.bots.map(b => b.id === id ? { ...b, status: bot.status } : b)
          }));
        }
      },
      assignPack: (botId, packId) => {
        // Not implemented in backend yet
        set((state) => ({
          bots: state.bots.map(bot =>
            bot.id === botId
              ? { ...bot, taskPacks: [...bot.taskPacks, packId] }
              : bot
          ),
        }));
      },
      unassignPack: (botId, packId) => {
        set((state) => ({
          bots: state.bots.map(bot =>
            bot.id === botId
              ? { ...bot, taskPacks: bot.taskPacks.filter(p => p !== packId) }
              : bot
          ),
        }));
      },
    }),
    {
      name: 'clawd-bots',
    }
  )
);

// Task Pack Store
interface TaskPackState {
  packs: TaskPack[];
  fetchPacks: () => Promise<void>;
  togglePack: (id: string) => void;
  updatePack: (id: string, updates: Partial<TaskPack>) => void;
}

export const useTaskPackStore = create<TaskPackState>()(
  (set) => ({
    packs: [],
    fetchPacks: async () => {
      // TODO: Connect to real backend endpoint when available
      // For now, start with empty state
      set({ packs: [] });
    },
    togglePack: (id) => {
      set((state) => ({
        packs: state.packs.map(pack =>
          pack.id === id ? { ...pack, enabled: !pack.enabled } : pack
        ),
      }));
    },
    updatePack: (id, updates) => {
      set((state) => ({
        packs: state.packs.map(pack =>
          pack.id === id ? { ...pack, ...updates } : pack
        ),
      }));
    },
  })
);

// Channel Store
interface ChannelState {
  channels: Channel[];
  fetchChannels: () => Promise<void>;
  connectChannel: (type: string, config: any) => Promise<void>;
  disconnectChannel: (id: string) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
}

export const useChannelStore = create<ChannelState>()(
  (set) => ({
    channels: [],
    fetchChannels: async () => {
      try {
        const response = await api.getChannels();
        if (response.success && response.data && Array.isArray(response.data.data)) {
          set({ channels: response.data.data });
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    },
    connectChannel: async (type, config) => {
      try {
        const response = await api.connectChannel(type, config);
        if (response.success && response.data) {
          set((state) => ({ channels: [...state.channels, response.data] }));
        }
      } catch (error) {
        console.error('Connect channel error:', error);
      }
    },
    disconnectChannel: async (id) => {
      set((state) => ({
        channels: state.channels.map(ch =>
          ch.id === id ? { ...ch, status: 'disconnected' } : ch
        ),
      }));
      try {
        await api.disconnectChannel(id);
      } catch (error) {
        console.error('Disconnect channel error:', error);
      }
    },
    updateChannel: async (id, updates) => {
      set((state) => ({
        channels: state.channels.map(ch =>
          ch.id === id ? { ...ch, ...updates } : ch
        ),
      }));
      try {
        await api.updateChannel(id, updates);
      } catch (error) {
        console.error('Update channel error:', error);
      }
    },
  })
);

// Family Store
interface FamilyState {
  family: Family | null;
  members: FamilyMember[];
  fetchFamily: () => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  removeMember: (id: string) => void;
  updateMemberRole: (id: string, role: string) => void;
}

export const useFamilyStore = create<FamilyState>()(
  (set) => ({
    family: null,
    members: [],
    fetchFamily: async () => {
      // TODO: Connect to real backend endpoint when available
      set({ family: null, members: [] });
    },
    inviteMember: async (email, role) => {
      // TODO: Connect to real backend endpoint
      const newMember: FamilyMember = {
        id: `member-${Date.now()}`,
        userId: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: role as any,
        joinedAt: new Date(),
        permissions: [],
      };
      set((state) => ({ members: [...state.members, newMember] }));
    },
    removeMember: (id) => {
      set((state) => ({
        members: state.members.filter(m => m.id !== id),
      }));
    },
    updateMemberRole: (id, role) => {
      set((state) => ({
        members: state.members.map(m =>
          m.id === id ? { ...m, role: role as any } : m
        ),
      }));
    },
  })
);

// Activity Store
interface ActivityState {
  activities: Activity[];
  fetchActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;
}

export const useActivityStore = create<ActivityState>()(
  (set) => ({
    activities: [],
    fetchActivities: async () => {
      // TODO: Connect to real backend endpoint when available
      set({ activities: [] });
    },
    addActivity: (activity) => {
      const newActivity: Activity = {
        ...activity,
        id: `act-${Date.now()}`,
        createdAt: new Date(),
      };
      set((state) => ({
        activities: [newActivity, ...state.activities],
      }));
    },
  })
);

// Notification Store
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  (set) => ({
    notifications: [],
    unreadCount: 0,
    addNotification: (notification) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        read: false,
        createdAt: new Date(),
      };
      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    },
    markAsRead: (id) => {
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    },
    markAllAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    },
    dismissNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    },
  })
);

// Onboarding Store
interface OnboardingStateStore {
  isOnboarding: boolean;
  currentStep: number;
  state: OnboardingState;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  updateState: (updates: Partial<OnboardingState>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStateStore>()(
  (set) => ({
    isOnboarding: false,
    currentStep: 1,
    state: {
      step: 1,
      selectedPacks: [],
      selectedChannels: [],
      channelConfigs: {},
    },
    startOnboarding: () => {
      set({
        isOnboarding: true,
        currentStep: 1,
        state: {
          step: 1,
          selectedPacks: [],
          selectedChannels: [],
          channelConfigs: {},
        },
      });
    },
    nextStep: () => {
      set((state) => ({
        currentStep: Math.min(state.currentStep + 1, 3),
        state: { ...state.state, step: Math.min(state.currentStep + 1, 3) },
      }));
    },
    prevStep: () => {
      set((state) => ({
        currentStep: Math.max(state.currentStep - 1, 1),
        state: { ...state.state, step: Math.max(state.currentStep - 1, 1) },
      }));
    },
    updateState: (updates) => {
      set((state) => ({
        state: { ...state.state, ...updates },
      }));
    },
    completeOnboarding: () => {
      set({ isOnboarding: false, currentStep: 1 });
    },
    resetOnboarding: () => {
      set({
        isOnboarding: false,
        currentStep: 1,
        state: {
          step: 1,
          selectedPacks: [],
          selectedChannels: [],
          channelConfigs: {},
        },
      });
    },
  })
);

// UI Store
interface UIState {
  sidebarCollapsed: boolean;
  activePanel: string;
  isLoading: boolean;
  toggleSidebar: () => void;
  setActivePanel: (panel: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activePanel: 'dashboard',
      isLoading: false,
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      setActivePanel: (panel) => {
        set({ activePanel: panel });
      },
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'clawd-ui',
    }
  )
);
