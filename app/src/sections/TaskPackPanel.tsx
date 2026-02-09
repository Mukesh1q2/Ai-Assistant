import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Sparkles,
  Home,
  Users,
  Heart,
  Music,
  Plane,
  Code,
  Mail,
  Settings,
  ChevronRight,
  Shield,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTaskPackStore } from '@/store';
import type { TaskPack } from '@/types';

const categoryIcons: Record<string, React.ElementType> = {
  productivity: Mail,
  home: Home,
  family: Users,
  health: Heart,
  entertainment: Music,
  travel: Plane,
  development: Code,
};

const categoryColors: Record<string, string> = {
  productivity: 'bg-blue-500/10 text-blue-500',
  home: 'bg-violet-500/10 text-violet-500',
  family: 'bg-rose-500/10 text-rose-500',
  health: 'bg-emerald-500/10 text-emerald-500',
  entertainment: 'bg-fuchsia-500/10 text-fuchsia-500',
  travel: 'bg-indigo-500/10 text-indigo-500',
  development: 'bg-slate-500/10 text-slate-500',
};

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

export default function TaskPackPanel() {
  const { packs, togglePack, updatePack } = useTaskPackStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPack, setSelectedPack] = useState<TaskPack | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(packs.map(p => p.category)))];

  const filteredPacks = packs.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pack.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || pack.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const enabledCount = packs.filter(p => p.enabled).length;

  const handleViewDetails = (pack: TaskPack) => {
    setSelectedPack(pack);
    setDetailOpen(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Task Packs</h1>
          <p className="text-muted-foreground">
            {enabledCount} of {packs.length} packs enabled
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Packs Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPacks.map((pack) => {
          const Icon = categoryIcons[pack.category] || Sparkles;
          const colorClass = categoryColors[pack.category] || 'bg-primary/10 text-primary';
          
          return (
            <Card 
              key={pack.id}
              className={`group hover:border-primary/30 transition-all cursor-pointer ${
                pack.enabled ? 'border-primary/30' : ''
              }`}
              onClick={() => handleViewDetails(pack)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{pack.name}</CardTitle>
                      <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground mt-1 inline-block">
                        {pack.category}
                      </span>
                    </div>
                  </div>
                  <Switch 
                    checked={pack.enabled}
                    onCheckedChange={() => togglePack(pack.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {pack.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      {pack.tools.length} tools
                    </span>
                    {pack.schedules.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pack.schedules.length} schedules
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {filteredPacks.length === 0 && (
        <motion.div 
          variants={itemVariants}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No packs found</h3>
          <p className="text-muted-foreground">
            Try a different search term or category
          </p>
        </motion.div>
      )}

      {/* Pack Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedPack && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${categoryColors[selectedPack.category]} flex items-center justify-center`}>
                    {(() => {
                      const Icon = categoryIcons[selectedPack.category] || Sparkles;
                      return <Icon className="w-7 h-7" />;
                    })()}
                  </div>
                  <div>
                    <SheetTitle>{selectedPack.name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${selectedPack.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {selectedPack.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs border">{selectedPack.category}</span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <p className="text-muted-foreground">{selectedPack.description}</p>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {selectedPack.enabled ? (
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Play className="w-5 h-5 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Pause className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">Pack Status</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPack.enabled ? 'Active and running' : 'Currently disabled'}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={selectedPack.enabled}
                      onCheckedChange={() => togglePack(selectedPack.id)}
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tools</span>
                          <span className="font-medium">{selectedPack.tools.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prompts</span>
                          <span className="font-medium">{selectedPack.prompts.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Schedules</span>
                          <span className="font-medium">{selectedPack.schedules.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tools" className="space-y-4">
                  <div className="space-y-2">
                    {selectedPack.tools.map((tool, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{tool}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Auto-execute</p>
                          <p className="text-xs text-muted-foreground">Run tasks automatically without approval</p>
                        </div>
                        <Switch 
                          checked={selectedPack.config.autoExecute}
                          onCheckedChange={(checked) => updatePack(selectedPack.id, {
                            config: { ...selectedPack.config, autoExecute: checked }
                          })}
                        />
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Require Approval</p>
                          <p className="text-xs text-muted-foreground">Ask for confirmation before executing</p>
                        </div>
                        <Switch 
                          checked={selectedPack.config.requireApproval}
                          onCheckedChange={(checked) => updatePack(selectedPack.id, {
                            config: { ...selectedPack.config, requireApproval: checked }
                          })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Permissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedPack.config.permissions.map((perm, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted"
                          >
                            <span className="text-sm">{perm.resource}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${perm.granted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {perm.action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
