import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Bot,
  Package,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBotStore, useTaskPackStore, useChannelStore } from '@/store';
import { botTemplates } from '@/data/bots';
import { toast } from 'sonner';

interface BotCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export default function BotCreationWizard({ isOpen, onClose }: BotCreationWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Selection states
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [botName, setBotName] = useState('');
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const { createBot } = useBotStore();
  const { packs } = useTaskPackStore();
  const { channels } = useChannelStore();

  const handleNext = () => {
    if (step < 4) setStep((prev) => (prev + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as WizardStep);
  };

  const togglePack = (packId: string) => {
    setSelectedPacks(prev => 
      prev.includes(packId) 
        ? prev.filter(id => id !== packId)
        : [...prev, packId]
    );
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    const template = botTemplates.find(t => t.name === selectedTemplate);
    if (!template) return;
    
    await createBot({
      name: botName || template.name,
      description: template.description,
      avatar: template.avatar,
      type: template.type,
      config: template.config,
    });
    
    // Simulate deployment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsDeploying(false);
    setIsComplete(true);
    
    toast.success(`${botName || template.name} deployed successfully!`);
    
    // Close after showing success
    setTimeout(() => {
      onClose();
      setStep(1);
      setSelectedTemplate(null);
      setBotName('');
      setSelectedPacks([]);
      setSelectedChannels([]);
      setIsComplete(false);
    }, 2000);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return botName.trim().length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return true; // Optional step
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Choose Your Assistant</h3>
        <p className="text-sm text-muted-foreground">Select a bot template to get started</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
        {botTemplates.map((template) => (
          <button
            key={template.name}
            onClick={() => {
              setSelectedTemplate(template.name);
              setBotName(template.name);
            }}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
              selectedTemplate === template.name
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <img 
              src={template.avatar} 
              alt={template.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h4 className="font-medium text-foreground">{template.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
            </div>
            {selectedTemplate === template.name && (
              <CheckCircle2 className="w-5 h-5 text-primary ml-auto flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Configure Your Bot</h3>
        <p className="text-sm text-muted-foreground">Give your assistant a name and personality</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bot-name">Bot Name</Label>
          <Input
            id="bot-name"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="My Email Assistant"
            className="text-lg"
          />
        </div>

        {selectedTemplate && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={botTemplates.find(t => t.name === selectedTemplate)?.avatar} 
                alt=""
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium text-foreground">{selectedTemplate}</p>
                <p className="text-sm text-muted-foreground">Template</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Enable Task Packs</h3>
        <p className="text-sm text-muted-foreground">Choose which automations to enable (optional)</p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {packs.map((pack) => (
          <button
            key={pack.id}
            onClick={() => togglePack(pack.id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
              selectedPacks.includes(pack.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{pack.name}</p>
                <p className="text-sm text-muted-foreground">{pack.description}</p>
              </div>
            </div>
            {selectedPacks.includes(pack.id) && (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Connect Channels</h3>
        <p className="text-sm text-muted-foreground">Choose where your bot will receive messages (optional)</p>
      </div>

      <div className="space-y-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => toggleChannel(channel.id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
              selectedChannels.includes(channel.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{channel.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{channel.type} • {channel.status}</p>
              </div>
            </div>
            {selectedChannels.includes(channel.id) && (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            )}
          </button>
        ))}
      </div>

      {channels.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No channels connected yet.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              onClose();
              // Navigate to channels panel
            }}
          >
            Connect Channel
          </Button>
        </div>
      )}
    </div>
  );

  const renderDeploying = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Deploying {botName}...</h3>
      <p className="text-muted-foreground">This will only take a moment</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 text-emerald-500" />
      </motion.div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Bot Deployed!</h3>
      <p className="text-muted-foreground">{botName} is now active and ready to help</p>
    </div>
  );

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
          className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-primary/25">
                {isComplete ? (
                  <Check className="w-5 h-5 text-white" />
                ) : isDeploying ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Create Bot</h2>
                {!isDeploying && !isComplete && (
                  <p className="text-sm text-muted-foreground">Step {step} of 4</p>
                )}
              </div>
            </div>
            {!isDeploying && !isComplete && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {!isDeploying && !isComplete && (
            <div className="w-full h-1 bg-muted">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF]"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              {isDeploying && renderDeploying()}
              {isComplete && renderSuccess()}
              {!isDeploying && !isComplete && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                  {step === 4 && renderStep4()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {!isDeploying && !isComplete && (
            <div className="flex items-center justify-between p-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex gap-2">
                {step < 4 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleDeploy}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Deploy Bot
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
