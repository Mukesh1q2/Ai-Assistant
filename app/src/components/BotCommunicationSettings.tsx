import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessagesSquare,
  ArrowRight,
  Plus,
  Trash2,
  X,
  Check,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Bot } from '@/types';

interface BotCommunication {
  id: string;
  sourceBotId: string;
  targetBotId: string;
  enabled: boolean;
  bidirectional: boolean;
  permissions: string[];
  createdAt: Date;
}

interface BotCommunicationSettingsProps {
  bots: Bot[];
  isOpen: boolean;
  onClose: () => void;
}

const availablePermissions = [
  { id: 'read_memory', label: 'Read Memory', description: 'Access stored memories' },
  { id: 'write_memory', label: 'Write Memory', description: 'Store new memories' },
  { id: 'trigger_action', label: 'Trigger Actions', description: 'Execute tasks' },
  { id: 'share_context', label: 'Share Context', description: 'Share conversation context' },
  { id: 'notify_events', label: 'Event Notifications', description: 'Send/receive event alerts' },
];

export default function BotCommunicationSettings({
  bots,
  isOpen,
  onClose,
}: BotCommunicationSettingsProps) {
  // Use lazy initialization for mock data to avoid Date.now() during render
  const [communications, setCommunications] = useState<BotCommunication[]>(() => [
    {
      id: 'comm-1',
      sourceBotId: 'bot-1',
      targetBotId: 'bot-2',
      enabled: true,
      bidirectional: true,
      permissions: ['read_memory', 'share_context', 'notify_events'],
      createdAt: new Date('2026-01-30T10:00:00Z'),
    },
    {
      id: 'comm-2',
      sourceBotId: 'bot-3',
      targetBotId: 'bot-4',
      enabled: true,
      bidirectional: false,
      permissions: ['trigger_action', 'notify_events'],
      createdAt: new Date('2026-02-03T10:00:00Z'),
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCommunication, setNewCommunication] = useState<Partial<BotCommunication>>({
    sourceBotId: '',
    targetBotId: '',
    bidirectional: true,
    permissions: ['read_memory', 'share_context'],
  });

  const handleCreate = () => {
    if (!newCommunication.sourceBotId || !newCommunication.targetBotId) {
      toast.error('Please select both bots');
      return;
    }
    if (newCommunication.sourceBotId === newCommunication.targetBotId) {
      toast.error('Cannot connect a bot to itself');
      return;
    }

    const exists = communications.some(
      (c) =>
        (c.sourceBotId === newCommunication.sourceBotId &&
          c.targetBotId === newCommunication.targetBotId) ||
        (c.sourceBotId === newCommunication.targetBotId &&
          c.targetBotId === newCommunication.sourceBotId)
    );
    if (exists) {
      toast.error('Communication already exists between these bots');
      return;
    }

    const communication: BotCommunication = {
      id: `comm-${Date.now()}`,
      sourceBotId: newCommunication.sourceBotId!,
      targetBotId: newCommunication.targetBotId!,
      enabled: true,
      bidirectional: newCommunication.bidirectional || false,
      permissions: newCommunication.permissions || [],
      createdAt: new Date(),
    };

    setCommunications([...communications, communication]);
    setIsCreating(false);
    setNewCommunication({
      sourceBotId: '',
      targetBotId: '',
      bidirectional: true,
      permissions: ['read_memory', 'share_context'],
    });
    toast.success('Bot communication established');
  };

  const handleDelete = (id: string) => {
    setCommunications(communications.filter((c) => c.id !== id));
    toast.success('Communication removed');
  };

  const handleToggle = (id: string) => {
    setCommunications(
      communications.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const getBotById = (id: string) => bots.find((b) => b.id === id);

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
                <MessagesSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Bot-to-Bot Communication</h2>
                <p className="text-sm text-muted-foreground">
                  {communications.filter((c) => c.enabled).length} of {communications.length} active
                  connections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isCreating && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Connection
                </Button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {isCreating ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                  Back to connections
                </button>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Create New Connection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Bot Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Source Bot</Label>
                        <select
                          value={newCommunication.sourceBotId}
                          onChange={(e) =>
                            setNewCommunication({ ...newCommunication, sourceBotId: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                        >
                          <option value="">Select bot...</option>
                          {bots.map((bot) => (
                            <option key={bot.id} value={bot.id}>
                              {bot.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Target Bot</Label>
                        <select
                          value={newCommunication.targetBotId}
                          onChange={(e) =>
                            setNewCommunication({ ...newCommunication, targetBotId: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                        >
                          <option value="">Select bot...</option>
                          {bots.map((bot) => (
                            <option key={bot.id} value={bot.id}>
                              {bot.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Visual Connection */}
                    {newCommunication.sourceBotId && newCommunication.targetBotId && (
                      <div className="flex items-center justify-center gap-4 py-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                          <img
                            src={getBotById(newCommunication.sourceBotId)?.avatar}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <span className="font-medium">
                            {getBotById(newCommunication.sourceBotId)?.name}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <ArrowRight className="w-6 h-6 text-primary" />
                          {newCommunication.bidirectional && (
                            <ArrowRight className="w-6 h-6 text-primary rotate-180" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                          <img
                            src={getBotById(newCommunication.targetBotId)?.avatar}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <span className="font-medium">
                            {getBotById(newCommunication.targetBotId)?.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <Share2 className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Bidirectional</p>
                            <p className="text-sm text-muted-foreground">
                              Allow both bots to communicate with each other
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={newCommunication.bidirectional}
                          onCheckedChange={(checked) =>
                            setNewCommunication({ ...newCommunication, bidirectional: checked })
                          }
                        />
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availablePermissions.map((perm) => (
                          <button
                            key={perm.id}
                            onClick={() => {
                              const perms = newCommunication.permissions || [];
                              const newPerms = perms.includes(perm.id)
                                ? perms.filter((p) => p !== perm.id)
                                : [...perms, perm.id];
                              setNewCommunication({ ...newCommunication, permissions: newPerms });
                            }}
                            className={`p-3 rounded-lg border text-left transition-all ${(newCommunication.permissions || []).includes(perm.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {(newCommunication.permissions || []).includes(perm.id) ? (
                                <Check className="w-4 h-4 text-primary" />
                              ) : (
                                <div className="w-4 h-4 rounded border border-muted-foreground/30" />
                              )}
                              <span className="font-medium text-sm text-foreground">{perm.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">{perm.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={handleCreate}>
                        <Check className="w-4 h-4 mr-2" />
                        Create Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {communications.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <MessagesSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No connections yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Enable bots to communicate and share information
                    </p>
                    <Button onClick={() => setIsCreating(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Connection
                    </Button>
                  </div>
                )}

                {communications.map((comm) => {
                  const sourceBot = getBotById(comm.sourceBotId);
                  const targetBot = getBotById(comm.targetBotId);

                  return (
                    <Card
                      key={comm.id}
                      className={`bg-card/50 backdrop-blur-sm border-border/50 transition-all ${comm.enabled ? '' : 'opacity-60'
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Source Bot */}
                            <div className="flex items-center gap-3">
                              <img
                                src={sourceBot?.avatar}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium text-foreground">{sourceBot?.name}</p>
                                <p className="text-xs text-muted-foreground">Source</p>
                              </div>
                            </div>

                            {/* Connection */}
                            <div className="flex flex-col items-center gap-0.5 px-4">
                              <ArrowRight className="w-5 h-5 text-primary" />
                              {comm.bidirectional && (
                                <ArrowRight className="w-5 h-5 text-primary rotate-180" />
                              )}
                            </div>

                            {/* Target Bot */}
                            <div className="flex items-center gap-3">
                              <img
                                src={targetBot?.avatar}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium text-foreground">{targetBot?.name}</p>
                                <p className="text-xs text-muted-foreground">Target</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch checked={comm.enabled} onCheckedChange={() => handleToggle(comm.id)} />
                            <button
                              onClick={() => handleDelete(comm.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Permissions */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex flex-wrap gap-2">
                            {comm.permissions.map((permId) => {
                              const perm = availablePermissions.find((p) => p.id === permId);
                              return perm ? (
                                <Badge key={permId} variant="secondary" className="text-xs">
                                  {perm.label}
                                </Badge>
                              ) : null;
                            })}
                            {comm.bidirectional && (
                              <Badge variant="outline" className="text-xs text-primary border-primary/30">
                                <Share2 className="w-3 h-3 mr-1" />
                                Bidirectional
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
