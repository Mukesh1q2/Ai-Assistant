import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
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
import { useChannelStore } from '@/store';
import type { Channel, ChannelType } from '@/types';
import TelegramSetup from '@/components/TelegramSetup';
import WhatsAppSetup from '@/components/WhatsAppSetup';
import { toast } from 'sonner';

const channelTypes: { type: ChannelType; name: string; description: string; color: string }[] = [
  {
    type: 'telegram',
    name: 'Telegram',
    description: 'Connect via Bot API token',
    color: 'bg-blue-500/10 text-blue-500'
  },
  {
    type: 'whatsapp',
    name: 'WhatsApp',
    description: 'Business API integration',
    color: 'bg-emerald-500/10 text-emerald-500'
  },
  {
    type: 'discord',
    name: 'Discord',
    description: 'OAuth bot integration',
    color: 'bg-indigo-500/10 text-indigo-500'
  },
  {
    type: 'slack',
    name: 'Slack',
    description: 'Workspace app integration',
    color: 'bg-purple-500/10 text-purple-500'
  },
  {
    type: 'email',
    name: 'Email',
    description: 'SMTP/IMAP integration',
    color: 'bg-amber-500/10 text-amber-500'
  },
];

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

export default function ChannelPanel() {
  const { channels, connectChannel, disconnectChannel, updateChannel } = useChannelStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [connectingType, setConnectingType] = useState<ChannelType | null>(null);
  const [connectionConfig, setConnectionConfig] = useState({
    token: '',
    webhook: '',
  });

  // Platform-specific setup dialogs
  const [telegramSetupOpen, setTelegramSetupOpen] = useState(false);
  const [whatsappSetupOpen, setWhatsappSetupOpen] = useState(false);

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedCount = channels.filter(c => c.status === 'connected').length;

  const handleConnect = (type: ChannelType) => {
    // Open platform-specific setup wizard
    if (type === 'telegram') {
      setTelegramSetupOpen(true);
      setCreateDialogOpen(false);
    } else if (type === 'whatsapp') {
      setWhatsappSetupOpen(true);
      setCreateDialogOpen(false);
    } else {
      setConnectingType(type);
    }
  };

  const handleIntegrationSuccess = (integration: any) => {
    toast.success(`${integration.platform} connected successfully!`);
    // The integration is stored in the backend, refresh channels if needed
  };

  const handleSubmitConnection = async () => {
    if (connectingType) {
      await connectChannel(connectingType, connectionConfig);
      setConnectingType(null);
      setConnectionConfig({ token: '', webhook: '' });
      setCreateDialogOpen(false);
    }
  };

  const handleViewDetails = (channel: Channel) => {
    setSelectedChannel(channel);
    setDetailOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500">Connected</span>;
      case 'disconnected':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Disconnected</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-500">Pending</span>;
      case 'error':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-500">Error</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Unknown</span>;
    }
  };

  const getChannelTypeInfo = (type: string) => {
    return channelTypes.find(ct => ct.type === type) || channelTypes[0];
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
          <h1 className="text-2xl font-display font-bold">Channels</h1>
          <p className="text-muted-foreground">
            {connectedCount} of {channels.length} channels connected
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Connect Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Connect Channel</DialogTitle>
              <DialogDescription>
                Choose a messaging platform to connect with your bots.
              </DialogDescription>
            </DialogHeader>

            {!connectingType ? (
              <div className="grid grid-cols-1 gap-3 mt-4">
                {channelTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => handleConnect(type.type)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center`}>
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setConnectingType(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </button>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {connectingType === 'telegram' ? 'Bot Token' :
                      connectingType === 'discord' ? 'Bot Token' :
                        connectingType === 'whatsapp' ? 'API Key' : 'Connection String'}
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your token..."
                    value={connectionConfig.token}
                    onChange={(e) => setConnectionConfig({ ...connectionConfig, token: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your credentials are encrypted and stored securely.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setConnectingType(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSubmitConnection}>
                    Connect
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Channels Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredChannels.map((channel) => {
          const typeInfo = getChannelTypeInfo(channel.type);

          return (
            <Card
              key={channel.id}
              className="group hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => handleViewDetails(channel)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${typeInfo.color} flex items-center justify-center`}>
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{channel.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(channel.status)}
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
                      {channel.status === 'connected' ? (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          disconnectChannel(channel.id);
                        }}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Disconnect
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          toast.info('Please reconnect through the channel setup wizard');
                        }}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Reconnect
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove "${channel.name}"? This will disconnect all bots from it.`)) {
                            disconnectChannel(channel.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{channel.type}</span>
                  {channel.connectedAt && (
                    <span className="text-muted-foreground">
                      Connected {new Date(channel.connectedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {filteredChannels.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No channels found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Connect your first channel to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Channel
            </Button>
          )}
        </motion.div>
      )}

      {/* Channel Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedChannel && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4">
                  {(() => {
                    const typeInfo = getChannelTypeInfo(selectedChannel.type);
                    return (
                      <div className={`w-16 h-16 rounded-xl ${typeInfo.color} flex items-center justify-center`}>
                        <MessageSquare className="w-8 h-8" />
                      </div>
                    );
                  })()}
                  <div>
                    <SheetTitle>{selectedChannel.name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedChannel.status)}
                      <span className="text-sm text-muted-foreground capitalize">
                        {selectedChannel.type}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(selectedChannel.status)}
                      <div>
                        <p className="font-medium">Connection Status</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedChannel.status}
                        </p>
                      </div>
                    </div>
                    {selectedChannel.status === 'connected' ? (
                      <Button variant="outline" size="sm" onClick={() => disconnectChannel(selectedChannel.id)}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => toast.info('Please reconnect through the channel setup wizard')}>
                        Reconnect
                      </Button>
                    )}
                  </div>

                  {selectedChannel.connectedAt && (
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Connected Since</p>
                      <p className="font-medium">{new Date(selectedChannel.connectedAt).toLocaleString()}</p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Channel ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{selectedChannel.id}</code>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="p-4 rounded-lg border border-border space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Webhook URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={selectedChannel.config.webhook || ''}
                          placeholder="https://..."
                          onChange={(e) => updateChannel(selectedChannel.id, {
                            config: { ...selectedChannel.config, webhook: e.target.value }
                          })}
                        />
                        <Button variant="outline" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-destructive/50">
                    <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Removing this channel will disconnect all bots from it.
                    </p>
                    <Button variant="destructive" size="sm" onClick={() => {
                      if (window.confirm(`Remove "${selectedChannel.name}"? This will disconnect all bots from it.`)) {
                        disconnectChannel(selectedChannel.id);
                        setDetailOpen(false);
                      }
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Channel
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Platform Setup Dialogs */}
      <TelegramSetup
        isOpen={telegramSetupOpen}
        onClose={() => setTelegramSetupOpen(false)}
        onSuccess={handleIntegrationSuccess}
      />
      <WhatsAppSetup
        isOpen={whatsappSetupOpen}
        onClose={() => setWhatsappSetupOpen(false)}
        onSuccess={handleIntegrationSuccess}
      />
    </motion.div>
  );
}

