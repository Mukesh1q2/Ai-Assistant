import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/types';

interface RateLimitIndicatorProps {
  plan: Plan;
  showDetails?: boolean;
}

interface UsageStats {
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
}

export default function RateLimitIndicator({ plan, showDetails = false }: RateLimitIndicatorProps) {
  const [usage] = useState<UsageStats>({
    hourly: 45,
    daily: 342,
    weekly: 2156,
    monthly: plan.usedExecutions,
  });

  const [isExpanded, setIsExpanded] = useState(showDetails);

  const monthlyPercentage = Math.min(100, (usage.monthly / plan.executionQuota) * 100);
  const dailyPercentage = Math.min(100, (usage.daily / (plan.executionQuota / 30)) * 100);
  const hourlyPercentage = Math.min(100, (usage.hourly / (plan.executionQuota / 30 / 24)) * 100);

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-emerald-500';
    if (percentage < 75) return 'text-amber-500';
    if (percentage < 90) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusBg = (percentage: number) => {
    if (percentage < 50) return 'bg-emerald-500';
    if (percentage < 75) return 'bg-amber-500';
    if (percentage < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderStatusIcon = () => {
    const iconClass = `w-5 h-5 ${getStatusColor(monthlyPercentage)}`;
    if (monthlyPercentage < 75) return <CheckCircle className={iconClass} />;
    return <AlertTriangle className={iconClass} />;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        {/* Main Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Execution Quota</p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(usage.monthly)} / {formatNumber(plan.executionQuota)} executions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor(monthlyPercentage)}`}>
              {monthlyPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${monthlyPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`absolute h-full rounded-full ${getStatusBg(monthlyPercentage)}`}
          />
        </div>

        {/* Details Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? 'Hide details' : 'Show details'}
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border space-y-4"
          >
            {/* Hourly Usage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Hourly
                </span>
                <span className="text-sm text-foreground">{usage.hourly} executions</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getStatusBg(hourlyPercentage)}`}
                  style={{ width: `${hourlyPercentage}%` }}
                />
              </div>
            </div>

            {/* Daily Usage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Daily
                </span>
                <span className="text-sm text-foreground">{usage.daily} executions</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getStatusBg(dailyPercentage)}`}
                  style={{ width: `${dailyPercentage}%` }}
                />
              </div>
            </div>

            {/* Weekly Usage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  Weekly
                </span>
                <span className="text-sm text-foreground">{usage.weekly} executions</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getStatusBg(
                    Math.min(100, (usage.weekly / (plan.executionQuota / 4)) * 100)
                  )}`}
                  style={{ width: `${Math.min(100, (usage.weekly / (plan.executionQuota / 4)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Plan Info */}
            <div className="p-3 rounded-lg bg-muted space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <Badge variant="secondary" className="text-xs">
                  {plan.name}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Channel Limit</span>
                <span className="text-sm text-foreground">{plan.channelLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pack Limit</span>
                <span className="text-sm text-foreground">{plan.packLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Family Seats</span>
                <span className="text-sm text-foreground">{plan.familySeats}</span>
              </div>
              {plan.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm text-foreground">
                    {new Date(plan.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Warning */}
            {monthlyPercentage >= 90 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-500">Quota Almost Exhausted</p>
                  <p className="text-xs text-red-500/80 mt-1">
                    You have used {monthlyPercentage.toFixed(0)}% of your monthly quota. Consider upgrading
                    your plan to avoid service interruption.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
