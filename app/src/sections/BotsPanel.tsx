import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot as BotIcon,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Settings,
  Trash2,
  Zap,
  TrendingUp,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useBotStore, useTaskPackStore } from '@/store';
import { botTemplates } from '@/data/bots';
import type { Bot } from '@/types';

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

export default function BotsPanel() {
  const { bots, createBot, updateBot, deleteBot, toggleBotStatus, selectBot, selectedBot } = useBotStore();
  const { packs } = useTaskPackStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [creatingBot, setCreatingBot] = useState<string | null>(null);

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateBot = async (template: typeof botTemplates[0]) => {
    setCreatingBot(template.name);
    await createBot({
      name: template.name,
      description: template.description,
      avatar: template.avatar,
      type: template.type,
      config: template.config,
    });
    setCreatingBot(null);
    setCreateDialogOpen(false);
  };

  const handleViewDetails = (bot: Bot) => {
    selectBot(bot);
    setDetailOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500';
      case 'inactive':
        return 'bg-gray-400';
      case 'deploying':
        return 'bg-amber-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500">Active</span>;
      case 'inactive':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Inactive</span>;
      case 'deploying':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-500">Deploying</span>;
      case 'error':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-500">Error</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Unknown</span>;
    }
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
          <h1 className="text-2xl font-display font-bold">Bots</h1>
          <p className="text-muted-foreground">Manage your AI assistants</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Create New Bot</DialogTitle>
              <DialogDescription>
                Choose a bot template to get started. Each template comes pre-configured for specific tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                {botTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleCreateBot(template)}
                    disabled={creatingBot !== null}
                    className="text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={template.avatar} 
                        alt={template.name}
                        className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{template.name}</h3>
                          {creatingBot === template.name && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Bots Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBots.map((bot) => (
          <Card 
            key={bot.id}
            className="group hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => handleViewDetails(bot)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={bot.avatar} 
                      alt={bot.name}
                      className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(bot.status)}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{bot.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(bot.status)}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="p-2 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      toggleBotStatus(bot.id);
                    }}>
                      {bot.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(bot);
                    }}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBot(bot.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {bot.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    {bot.metrics.totalExecutions}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    {bot.metrics.uptime}%
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {bot.taskPacks.length} packs
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredBots.length === 0 && (
        <motion.div 
          variants={itemVariants}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <BotIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No bots found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first bot to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          )}
        </motion.div>
      )}

      {/* Bot Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedBot && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedBot.avatar} 
                    alt={selectedBot.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <SheetTitle>{selectedBot.name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedBot.status)}
                      <span className="text-sm text-muted-foreground">
                        Created {new Date(selectedBot.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="packs">Task Packs</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <p className="text-muted-foreground">{selectedBot.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-display font-bold">
                          {selectedBot.metrics.totalExecutions}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Executions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-display font-bold">
                          {selectedBot.metrics.uptime}%
                        </div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedBot.metrics.lastActive ? (
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm">Last active {new Date(selectedBot.metrics.lastActive).toLocaleString()}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No activity yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="packs" className="space-y-4">
                  <div className="space-y-2">
                    {packs.map((pack) => (
                      <div 
                        key={pack.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{pack.name}</p>
                            <p className="text-xs text-muted-foreground">{pack.description}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={selectedBot.taskPacks.includes(pack.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              useBotStore.getState().assignPack(selectedBot.id, pack.id);
                            } else {
                              useBotStore.getState().unassignPack(selectedBot.id, pack.id);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Bot Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Personality</label>
                        <Input 
                          value={selectedBot.config.personality}
                          onChange={(e) => updateBot(selectedBot.id, {
                            config: { ...selectedBot.config, personality: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Memory Scope</label>
                        <select 
                          className="w-full p-2 rounded-md border border-input bg-background"
                          value={selectedBot.config.memoryScope}
                          onChange={(e) => updateBot(selectedBot.id, {
                            config: { ...selectedBot.config, memoryScope: e.target.value as any }
                          })}
                        >
                          <option value="user">User Only</option>
                          <option value="family">Family</option>
                          <option value="global">Global</option>
                        </select>
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
