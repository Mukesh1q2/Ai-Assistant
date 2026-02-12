// Bot Types
export interface Bot {
  id: string;
  name: string;
  description: string;
  avatar: string;
  status: 'active' | 'inactive' | 'deploying' | 'error';
  type: BotType;
  createdAt: Date;
  updatedAt: Date;
  channels: Channel[];
  taskPacks: string[];
  metrics: BotMetrics;
  config: BotConfig;
}

export type BotType =
  | 'email'
  | 'calendar'
  | 'chores'
  | 'smarthome'
  | 'family'
  | 'routine'
  | 'wellness'
  | 'entertainment'
  | 'travel'
  | 'coding';

export interface BotMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastActive: Date | null;
  uptime: number;
}

export interface BotConfig {
  personality: string;
  memoryScope: 'user' | 'family' | 'global';
  systemPrompt?: string;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  guardrails: Guardrail[];
  permissions: Permission[];
}

export interface Guardrail {
  id: string;
  type: 'block' | 'approve' | 'log';
  action: string;
  condition?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'read' | 'write' | 'execute';
  granted: boolean;
}

// Task Pack Types
export interface TaskPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PackCategory;
  enabled: boolean;
  config: PackConfig;
  tools: string[];
  prompts: PromptTemplate[];
  schedules: Schedule[];
}

export type PackCategory =
  | 'productivity'
  | 'home'
  | 'family'
  | 'health'
  | 'entertainment'
  | 'travel'
  | 'development';

export interface PackConfig {
  permissions: Permission[];
  guardrails: Guardrail[];
  autoExecute: boolean;
  requireApproval: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

export interface Schedule {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// Channel Types
export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  config: ChannelConfig;
  connectedAt?: Date;
}

export type ChannelType = 'telegram' | 'whatsapp' | 'discord' | 'slack' | 'email';

export interface ChannelConfig {
  token?: string;
  webhook?: string;
  guildId?: string;
  channelId?: string;
  phoneNumber?: string;
  [key: string]: any;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  lastLoginAt?: Date;
  preferences: UserPreferences;
  plan: Plan;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
  timezone: string;
}

export interface Plan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'family' | 'custom';
  executionQuota: number;
  usedExecutions: number;
  channelLimit: number;
  packLimit: number;
  familySeats: number;
  expiresAt?: Date;
}

// Family Types
export interface Family {
  id: string;
  name: string;
  ownerId: string;
  members: FamilyMember[];
  sharedPacks: string[];
  createdAt: Date;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  permissions: FamilyPermission[];
}

export interface FamilyPermission {
  resource: string;
  action: string;
  granted: boolean;
}

// Activity Types
export interface Activity {
  id: string;
  type: ActivityType;
  botId?: string;
  packId?: string;
  userId?: string;
  channelId?: string;
  status: 'success' | 'failure' | 'pending';
  message: string;
  details?: Record<string, any>;
  createdAt: Date;
}

export type ActivityType =
  | 'bot_created'
  | 'bot_updated'
  | 'bot_deleted'
  | 'pack_enabled'
  | 'pack_disabled'
  | 'pack_executed'
  | 'channel_connected'
  | 'channel_disconnected'
  | 'message_received'
  | 'message_sent'
  | 'task_executed'
  | 'member_invited'
  | 'member_joined'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied';

// Analytics Types
export interface Analytics {
  period: string;
  executions: ExecutionStats;
  channels: ChannelStats;
  packs: PackStats;
  bots: BotStats;
}

export interface ExecutionStats {
  total: number;
  successful: number;
  failed: number;
  byDay: Record<string, number>;
  byPack: Record<string, number>;
}

export interface ChannelStats {
  total: number;
  active: number;
  messagesReceived: number;
  messagesSent: number;
  byChannel: Record<string, number>;
}

export interface PackStats {
  total: number;
  active: number;
  executions: number;
  byPack: Record<string, number>;
}

export interface BotStats {
  total: number;
  active: number;
  uptime: number;
  byBot: Record<string, number>;
}

// UI Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  children?: NavItem[];
}

// Demo Types
export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  bots: Bot[];
  packs: TaskPack[];
  channels: Channel[];
  familyMembers: FamilyMember[];
  activities: Activity[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Onboarding Types
export interface OnboardingState {
  step: number;
  botType?: BotType;
  botName?: string;
  selectedPacks: string[];
  selectedChannels: ChannelType[];
  channelConfigs: Record<string, ChannelConfig>;
}
