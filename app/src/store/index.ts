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
import {
  demoBots,
  demoTaskPacks,
  demoChannels,
  demoFamilyMembers,
  demoActivities
} from '@/data/bots';
import { authService } from '@/services';
import { clearAuthToken } from '@/services/api';

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
  createBot: (bot: Partial<Bot>) => Promise<Bot>;
  updateBot: (id: string, updates: Partial<Bot>) => void;
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
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ bots: demoBots, isLoading: false });
      },
      createBot: async (botData) => {
        const newBot: Bot = {
          id: `bot-${Date.now()}`,
          name: botData.name || 'New Bot',
          description: botData.description || '',
          avatar: botData.avatar || '/bots/coding-bot.png',
          status: 'deploying',
          type: botData.type || 'coding',
          createdAt: new Date(),
          updatedAt: new Date(),
          channels: [],
          taskPacks: [],
          metrics: {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            lastActive: null,
            uptime: 100,
          },
          config: botData.config || {
            personality: 'Helpful AI assistant',
            memoryScope: 'user',
            guardrails: [],
            permissions: [],
          },
        };

        set((state) => ({ bots: [...state.bots, newBot] }));

        // Simulate deployment
        setTimeout(() => {
          set((state) => ({
            bots: state.bots.map(b =>
              b.id === newBot.id ? { ...b, status: 'active' } : b
            ),
          }));
        }, 2000);

        return newBot;
      },
      updateBot: (id, updates) => {
        set((state) => ({
          bots: state.bots.map(bot =>
            bot.id === id ? { ...bot, ...updates, updatedAt: new Date() } : bot
          ),
        }));
      },
      deleteBot: (id) => {
        set((state) => ({
          bots: state.bots.filter(bot => bot.id !== id),
          selectedBot: state.selectedBot?.id === id ? null : state.selectedBot,
        }));
      },
      selectBot: (bot) => {
        set({ selectedBot: bot });
      },
      toggleBotStatus: (id) => {
        set((state) => ({
          bots: state.bots.map(bot =>
            bot.id === id
              ? { ...bot, status: bot.status === 'active' ? 'inactive' : 'active' }
              : bot
          ),
        }));
      },
      assignPack: (botId, packId) => {
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
  persist(
    (set) => ({
      packs: [],
      fetchPacks: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 400));
        set({ packs: demoTaskPacks });
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
    }),
    {
      name: 'clawd-packs',
    }
  )
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
  persist(
    (set) => ({
      channels: [],
      fetchChannels: async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        set({ channels: demoChannels });
      },
      connectChannel: async (type, config) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newChannel: Channel = {
          id: `channel-${Date.now()}`,
          type: type as any,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          status: 'connected',
          config,
          connectedAt: new Date(),
        };
        set((state) => ({ channels: [...state.channels, newChannel] }));
      },
      disconnectChannel: (id) => {
        set((state) => ({
          channels: state.channels.map(ch =>
            ch.id === id ? { ...ch, status: 'disconnected' } : ch
          ),
        }));
      },
      updateChannel: (id, updates) => {
        set((state) => ({
          channels: state.channels.map(ch =>
            ch.id === id ? { ...ch, ...updates } : ch
          ),
        }));
      },
    }),
    {
      name: 'clawd-channels',
    }
  )
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
  persist(
    (set) => ({
      family: null,
      members: [],
      fetchFamily: async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
        set({
          family: {
            id: 'family-1',
            name: 'Johnson Family',
            ownerId: 'user-1',
            members: demoFamilyMembers,
            sharedPacks: ['pack-4', 'pack-5'],
            createdAt: new Date('2024-01-15'),
          },
          members: demoFamilyMembers,
        });
      },
      inviteMember: async (email, role) => {
        await new Promise(resolve => setTimeout(resolve, 800));
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
    }),
    {
      name: 'clawd-family',
    }
  )
);

// Activity Store
interface ActivityState {
  activities: Activity[];
  fetchActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],
      fetchActivities: async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        set({ activities: demoActivities });
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
    }),
    {
      name: 'clawd-activities',
    }
  )
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
  persist(
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
    }),
    {
      name: 'clawd-notifications',
    }
  )
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
  persist(
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
    }),
    {
      name: 'clawd-onboarding',
    }
  )
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
