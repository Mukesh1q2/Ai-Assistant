import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText,
  Search,
  Download,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Bot,
  Package,
  Clock3,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface ExecutionLog {
  id: string;
  botId: string;
  botName: string;
  botAvatar: string;
  packId: string;
  packName: string;
  status: 'success' | 'failure' | 'pending' | 'warning';
  action: string;
  input: string;
  output: string;
  duration: number;
  createdAt: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface ExecutionLogsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock log data with static timestamps to avoid Date.now() during render
const mockLogs: ExecutionLog[] = [
  {
    id: 'log-1',
    botId: 'bot-1',
    botName: 'Email Assistant',
    botAvatar: '/bots/email-bot.png',
    packId: 'pack-1',
    packName: 'Email Management',
    status: 'success',
    action: 'send_email',
    input: 'Draft response to john@example.com about the project update',
    output: 'Email sent successfully. Subject: Re: Project Update',
    duration: 2450,
    createdAt: new Date('2026-02-06T15:55:00Z'),
  },
  {
    id: 'log-2',
    botId: 'bot-2',
    botName: 'Calendar Bot',
    botAvatar: '/bots/calendar-bot.png',
    packId: 'pack-2',
    packName: 'Calendar Management',
    status: 'success',
    action: 'schedule_meeting',
    input: 'Schedule team meeting for tomorrow at 2pm',
    output: 'Meeting scheduled: Team Sync on 2024-01-20 at 14:00',
    duration: 1800,
    createdAt: new Date('2026-02-06T15:45:00Z'),
  },
  {
    id: 'log-3',
    botId: 'bot-3',
    botName: 'Smart Home Controller',
    botAvatar: '/bots/smarthome-bot.png',
    packId: 'pack-3',
    packName: 'Smart Home',
    status: 'warning',
    action: 'adjust_temperature',
    input: 'Set living room temperature to 72°F',
    output: 'Temperature adjusted to 72°F (delayed response from device)',
    duration: 5200,
    createdAt: new Date('2026-02-06T15:30:00Z'),
  },
  {
    id: 'log-4',
    botId: 'bot-4',
    botName: 'Chores Bot',
    botAvatar: '/bots/chores-bot.png',
    packId: 'pack-4',
    packName: 'Household Chores',
    status: 'failure',
    action: 'order_groceries',
    input: 'Order milk and eggs from grocery store',
    output: '',
    duration: 3200,
    createdAt: new Date('2026-02-06T15:15:00Z'),
    error: 'API connection failed: Grocery service temporarily unavailable',
  },
  {
    id: 'log-5',
    botId: 'bot-1',
    botName: 'Email Assistant',
    botAvatar: '/bots/email-bot.png',
    packId: 'pack-1',
    packName: 'Email Management',
    status: 'pending',
    action: 'summarize_thread',
    input: 'Summarize the last 10 emails from the support team',
    output: '',
    duration: 0,
    createdAt: new Date('2026-02-06T15:59:30Z'),
  },
  {
    id: 'log-6',
    botId: 'bot-5',
    botName: 'Travel Planner',
    botAvatar: '/bots/travel-bot.png',
    packId: 'pack-6',
    packName: 'Travel Planning',
    status: 'success',
    action: 'search_flights',
    input: 'Find flights from NYC to LA next week',
    output: 'Found 15 flights. Best option: Delta DL123, $350, direct flight',
    duration: 4200,
    createdAt: new Date('2026-02-06T15:00:00Z'),
    metadata: { results: 15, provider: 'Delta' },
  },
];

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    label: 'Success',
  },
  failure: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Failed',
  },
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    label: 'Pending',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Warning',
  },
};

export default function ExecutionLogs({ isOpen, onClose }: ExecutionLogsProps) {
  const [logs] = useState<ExecutionLog[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.input.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDuration = (ms: number) => {
    if (ms === 0) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = useCallback((date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }, []);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-primary/25">
                <ScrollText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Execution Logs</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredLogs.length} of {logs.length} entries
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failure">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {(['success', 'failure', 'pending', 'warning'] as const).map((status) => {
                const count = logs.filter((l) => l.status === status).length;
                const config = statusConfig[status];
                return (
                  <Card key={status} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm text-muted-foreground">{config.label}</span>
                      </div>
                      <p className="text-2xl font-display font-bold text-foreground">{count}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Log List */}
            <div className="space-y-2">
              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ScrollText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No logs found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              )}

              {filteredLogs.map((log) => {
                const config = statusConfig[log.status];
                const isExpanded = expandedLog === log.id;

                return (
                  <Card
                    key={log.id}
                    className={`bg-card/50 backdrop-blur-sm border-border/50 transition-all ${isExpanded ? 'border-primary/30' : 'hover:border-primary/20'
                      }`}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <config.icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{log.action}</span>
                            <Badge variant="outline" className={`text-xs ${config.borderColor} ${config.color}`}>
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {log.botName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {log.packName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock3 className="w-3 h-3" />
                              {formatDuration(log.duration)}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border"
                        >
                          <div className="p-4 space-y-4">
                            {/* Input */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium text-muted-foreground">Input</Label>
                                <button
                                  onClick={() => handleCopy(log.input, `input-${log.id}`)}
                                  className="p-1 rounded hover:bg-muted transition-colors"
                                >
                                  {copiedId === `input-${log.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                              <div className="p-3 rounded-lg bg-muted font-mono text-sm text-foreground">
                                {log.input}
                              </div>
                            </div>

                            {/* Output */}
                            {log.output && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Output</Label>
                                  <button
                                    onClick={() => handleCopy(log.output, `output-${log.id}`)}
                                    className="p-1 rounded hover:bg-muted transition-colors"
                                  >
                                    {copiedId === `output-${log.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>
                                <div className="p-3 rounded-lg bg-muted font-mono text-sm text-foreground">
                                  {log.output}
                                </div>
                              </div>
                            )}

                            {/* Error */}
                            {log.error && (
                              <div>
                                <Label className="text-sm font-medium text-red-500 mb-2">Error</Label>
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-sm text-red-500">
                                  {log.error}
                                </div>
                              </div>
                            )}

                            {/* Metadata */}
                            {log.metadata && (
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground mb-2">Metadata</Label>
                                <div className="p-3 rounded-lg bg-muted font-mono text-sm text-foreground">
                                  <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


