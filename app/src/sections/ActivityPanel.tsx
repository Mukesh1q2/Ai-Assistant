import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Search,
  Filter,
  Bot,
  Package,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActivityStore } from '@/store';

const activityTypeIcons: Record<string, React.ElementType> = {
  bot_created: Bot,
  bot_updated: Bot,
  bot_deleted: Bot,
  pack_enabled: Package,
  pack_disabled: Package,
  pack_executed: Zap,
  channel_connected: MessageSquare,
  channel_disconnected: MessageSquare,
  message_received: MessageSquare,
  message_sent: MessageSquare,
  task_executed: Zap,
  member_invited: Users,
  member_joined: Users,
  approval_requested: Clock,
  approval_granted: CheckCircle,
  approval_denied: XCircle,
};

const activityTypeColors: Record<string, string> = {
  bot_created: 'bg-blue-500/10 text-blue-500',
  bot_updated: 'bg-blue-500/10 text-blue-500',
  bot_deleted: 'bg-red-500/10 text-red-500',
  pack_enabled: 'bg-emerald-500/10 text-emerald-500',
  pack_disabled: 'bg-gray-500/10 text-gray-500',
  pack_executed: 'bg-violet-500/10 text-violet-500',
  channel_connected: 'bg-indigo-500/10 text-indigo-500',
  channel_disconnected: 'bg-gray-500/10 text-gray-500',
  message_received: 'bg-cyan-500/10 text-cyan-500',
  message_sent: 'bg-cyan-500/10 text-cyan-500',
  task_executed: 'bg-amber-500/10 text-amber-500',
  member_invited: 'bg-rose-500/10 text-rose-500',
  member_joined: 'bg-rose-500/10 text-rose-500',
  approval_requested: 'bg-amber-500/10 text-amber-500',
  approval_granted: 'bg-emerald-500/10 text-emerald-500',
  approval_denied: 'bg-red-500/10 text-red-500',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function ActivityPanel() {
  const { activities } = useActivityStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterTypes.length === 0 || filterTypes.includes(activity.type);
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(activity.status);
    return matchesSearch && matchesType && matchesStatus;
  });

  const toggleFilterType = (type: string) => {
    setFilterTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleFilterStatus = (status: string) => {
    setFilterStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getActivityIcon = (type: string) => {
    return activityTypeIcons[type] || Activity;
  };

  const getActivityColor = (type: string) => {
    return activityTypeColors[type] || 'bg-gray-500/10 text-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diff = now.getTime() - activityDate.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return activityDate.toLocaleDateString();
  };

  const allTypes = Array.from(new Set(activities.map(a => a.type)));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-display font-bold">Activity</h1>
        <p className="text-muted-foreground">
          Track all bot actions and system events
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Type
                {filterTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filterTypes.length}</Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {allTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filterTypes.includes(type)}
                  onCheckedChange={() => toggleFilterType(type)}
                >
                  <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Status
                {filterStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filterStatus.length}</Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {['success', 'failure', 'pending'].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filterStatus.includes(status)}
                  onCheckedChange={() => toggleFilterStatus(status)}
                >
                  <span className="capitalize">{status}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(filterTypes.length > 0 || filterStatus.length > 0) && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setFilterTypes([]);
                setFilterStatus([]);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Activity List */}
      <motion.div variants={itemVariants}>
        <Card>
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border">
              {filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div 
                    key={activity.id}
                    className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.message}</p>
                        {getStatusIcon(activity.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="capitalize">{activity.type.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{formatTime(activity.createdAt)}</span>
                      </div>
                      {activity.details && (
                        <div className="mt-2 p-2 rounded bg-muted text-xs font-mono">
                          {JSON.stringify(activity.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </motion.div>

      {filteredActivities.length === 0 && (
        <motion.div 
          variants={itemVariants}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No activity found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filterTypes.length > 0 || filterStatus.length > 0
              ? 'Try adjusting your filters'
              : 'Activity will appear here when bots start working'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
