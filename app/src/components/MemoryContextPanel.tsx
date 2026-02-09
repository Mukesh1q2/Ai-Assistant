import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Database,
  Clock,
  User,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
  MessageSquare,
  Calendar,
  Home,
  FileText,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Bot } from '@/types';

interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: string;
  scope: 'user' | 'family' | 'global';
  source: string;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
}

interface MemoryContextPanelProps {
  bot: Bot;
  isOpen: boolean;
  onClose: () => void;
}

// Mock memory data with static timestamps
const mockMemories: MemoryEntry[] = [
  {
    id: 'mem-1',
    key: 'user.preferences.email_tone',
    value: 'Professional but friendly',
    category: 'preferences',
    scope: 'user',
    source: 'Email Assistant',
    createdAt: new Date('2026-01-30T10:00:00Z'),
    updatedAt: new Date('2026-02-04T10:00:00Z'),
    accessCount: 45,
  },
  {
    id: 'mem-2',
    key: 'family.calendar.preferred_times',
    value: 'Weekends mornings, weekday evenings after 6pm',
    category: 'calendar',
    scope: 'family',
    source: 'Calendar Bot',
    createdAt: new Date('2026-01-23T10:00:00Z'),
    updatedAt: new Date('2026-02-01T10:00:00Z'),
    accessCount: 23,
  },
  {
    id: 'mem-3',
    key: 'user.work.meeting_preferences',
    value: '30-min slots, no meetings before 9am',
    category: 'work',
    scope: 'user',
    source: 'Calendar Bot',
    createdAt: new Date('2026-01-07T10:00:00Z'),
    updatedAt: new Date('2026-01-27T10:00:00Z'),
    accessCount: 67,
  },
  {
    id: 'mem-4',
    key: 'home.devices.living_room_temp',
    value: '72°F',
    category: 'smarthome',
    scope: 'family',
    source: 'Smart Home Controller',
    createdAt: new Date('2026-02-03T10:00:00Z'),
    updatedAt: new Date('2026-02-06T14:00:00Z'),
    accessCount: 12,
  },
  {
    id: 'mem-5',
    key: 'user.shopping.grocery_list',
    value: 'Milk, Eggs, Bread, Coffee, Bananas',
    category: 'shopping',
    scope: 'user',
    source: 'Chores Bot',
    createdAt: new Date('2026-02-05T10:00:00Z'),
    updatedAt: new Date('2026-02-06T15:30:00Z'),
    accessCount: 8,
  },
];

const categoryIcons: Record<string, React.ElementType> = {
  preferences: User,
  calendar: Calendar,
  work: FileText,
  smarthome: Home,
  shopping: Tag,
  default: Database,
};

const scopeColors = {
  user: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  family: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  global: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
};

export default function MemoryContextPanel({ bot, isOpen, onClose }: MemoryContextPanelProps) {
  const [memories, setMemories] = useState<MemoryEntry[]>(mockMemories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch =
      memory.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = selectedScope === 'all' || memory.scope === selectedScope;
    const matchesCategory = selectedCategory === 'all' || memory.category === selectedCategory;
    return matchesSearch && matchesScope && matchesCategory;
  });

  const categories = Array.from(new Set(memories.map((m) => m.category)));

  const handleDelete = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    toast.success('Memory deleted');
  };

  const handleEdit = (memory: MemoryEntry) => {
    setEditingId(memory.id);
    setEditValue(memory.value);
  };

  const handleSave = (id: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, value: editValue, updatedAt: new Date() } : m
      )
    );
    setEditingId(null);
    toast.success('Memory updated');
  };

  // Format date - this is safe because it's called from event handlers/render, not during initial render
  const formatDate = useCallback((date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }, []);

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
          className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-primary/25">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Memory & Context</h2>
                <p className="text-sm text-muted-foreground">
                  {bot.name} • {memories.length} memories stored
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Memories</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{memories.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {formatDate(memories[0]?.updatedAt || new Date())}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-violet-500" />
                    <span className="text-sm text-muted-foreground">Access Count</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {memories.reduce((sum, m) => sum + m.accessCount, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                >
                  <option value="all">All Scopes</option>
                  <option value="user">User</option>
                  <option value="family">Family</option>
                  <option value="global">Global</option>
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Memory List */}
            <div className="space-y-3">
              {filteredMemories.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No memories found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              )}

              {filteredMemories.map((memory) => {
                const Icon = categoryIcons[memory.category] || categoryIcons.default;
                return (
                  <Card
                    key={memory.id}
                    className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono text-foreground bg-muted px-2 py-0.5 rounded">
                              {memory.key}
                            </code>
                            <Badge
                              variant="outline"
                              className={`text-xs ${scopeColors[memory.scope]}`}
                            >
                              {memory.scope}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {memory.category}
                            </Badge>
                          </div>

                          {editingId === memory.id ? (
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1"
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleSave(memory.id)}>
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground mt-1">{memory.value}</p>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>Source: {memory.source}</span>
                            <span>•</span>
                            <span>Updated {formatDate(memory.updatedAt)}</span>
                            <span>•</span>
                            <span>{memory.accessCount} accesses</span>
                          </div>
                        </div>

                        {editingId !== memory.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(memory)}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(memory.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
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
