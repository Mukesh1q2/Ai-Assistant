import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar,
  Repeat,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sun,
  Moon,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Schedule } from '@/types';

interface ScheduleManagerProps {
  schedules: Schedule[];
  onUpdate: (schedules: Schedule[]) => void;
}

const daysOfWeek = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

const presetSchedules = [
  { name: 'Morning Routine', cron: '0 7 * * *', description: 'Every day at 7:00 AM' },
  { name: 'Night Routine', cron: '0 22 * * *', description: 'Every day at 10:00 PM' },
  { name: 'Weekly Report', cron: '0 9 * * 1', description: 'Every Monday at 9:00 AM' },
  { name: 'Daily Digest', cron: '0 8 * * *', description: 'Every day at 8:00 AM' },
  { name: 'Hourly Check', cron: '0 * * * *', description: 'Every hour' },
];

const parseCron = (cron: string) => {
  const parts = cron.split(' ');
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
};

const formatCron = (cron: string) => {
  const parsed = parseCron(cron);
  
  if (cron === '0 7 * * *') return 'Daily at 7:00 AM';
  if (cron === '0 22 * * *') return 'Daily at 10:00 PM';
  if (cron === '0 9 * * 1') return 'Every Monday at 9:00 AM';
  if (cron === '0 8 * * *') return 'Daily at 8:00 AM';
  if (cron === '0 * * * *') return 'Every hour';
  
  const days = parsed.dayOfWeek !== '*' 
    ? parsed.dayOfWeek.split(',').map(d => daysOfWeek.find(day => day.value === d)?.label).filter(Boolean).join(', ')
    : 'Every day';
  
  const time = `${parsed.hour.padStart(2, '0')}:${parsed.minute.padStart(2, '0')}`;
  
  return `${days} at ${time}`;
};

export default function ScheduleManager({ schedules, onUpdate }: ScheduleManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: '',
    cron: '0 8 * * *',
    enabled: true,
  });

  const handleCreate = () => {
    if (!newSchedule.name) {
      toast.error('Please enter a schedule name');
      return;
    }

    const schedule: Schedule = {
      id: `schedule-${Date.now()}`,
      name: newSchedule.name,
      cron: newSchedule.cron || '0 8 * * *',
      enabled: newSchedule.enabled || true,
    };

    onUpdate([...schedules, schedule]);
    setIsCreating(false);
    setNewSchedule({ name: '', cron: '0 8 * * *', enabled: true });
    toast.success('Schedule created');
  };

  const handleUpdate = (id: string, updates: Partial<Schedule>) => {
    onUpdate(schedules.map(s => s.id === id ? { ...s, ...updates } : s));
    setEditingId(null);
    toast.success('Schedule updated');
  };

  const handleDelete = (id: string) => {
    onUpdate(schedules.filter(s => s.id !== id));
    toast.success('Schedule deleted');
  };

  const toggleEnabled = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      handleUpdate(id, { enabled: !schedule.enabled });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Schedules</h3>
          <p className="text-sm text-muted-foreground">
            {schedules.length} {schedules.length === 1 ? 'schedule' : 'schedules'} configured
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {/* Create New */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input
                    placeholder="e.g., Morning Routine"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preset Schedules</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {presetSchedules.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setNewSchedule({ ...newSchedule, cron: preset.cron, name: preset.name })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          newSchedule.cron === preset.cron
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {preset.name.includes('Morning') && <Sun className="w-4 h-4 text-amber-500" />}
                          {preset.name.includes('Night') && <Moon className="w-4 h-4 text-indigo-500" />}
                          {preset.name.includes('Report') && <Calendar className="w-4 h-4 text-blue-500" />}
                          {preset.name.includes('Digest') && <Bell className="w-4 h-4 text-emerald-500" />}
                          {preset.name.includes('Hourly') && <Clock className="w-4 h-4 text-violet-500" />}
                          <span className="font-medium text-sm text-foreground">{preset.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsCreating(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleCreate}>
                    <Check className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule List */}
      <div className="space-y-2">
        {schedules.length === 0 && !isCreating && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No schedules configured</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add your first schedule
            </Button>
          </div>
        )}

        {schedules.map((schedule) => (
          <Card 
            key={schedule.id} 
            className={`bg-card/50 backdrop-blur-sm border-border/50 transition-all ${
              schedule.enabled ? '' : 'opacity-60'
            }`}
          >
            <CardContent className="p-4">
              {editingId === schedule.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <Input
                    value={schedule.name}
                    onChange={(e) => handleUpdate(schedule.id, { name: e.target.value })}
                    className="font-medium"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Repeat className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{schedule.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCron(schedule.cron)}</p>
                      {schedule.lastRun && (
                        <p className="text-xs text-muted-foreground">
                          Last run: {new Date(schedule.lastRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={() => toggleEnabled(schedule.id)}
                    />
                    <button
                      onClick={() => setEditingId(schedule.id)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
