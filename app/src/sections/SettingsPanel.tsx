import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Shield, Key, Check, Loader2, Save } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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

export default function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState({
    openai_api_key: '',
    gemini_api_key: '',
    anthropic_api_key: '',
  });
  // Track which keys were actually edited to avoid sending masked values back
  const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resp: any = await api.getSettings();
      const data = resp.data || resp;
      if (data) {
        setKeys({
          openai_api_key: data.openai_api_key || '',
          gemini_api_key: data.gemini_api_key || '',
          anthropic_api_key: data.anthropic_api_key || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
    setEditedKeys(prev => new Set(prev).add(e.target.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedKeys.size === 0) {
      toast.info('No changes to save');
      return;
    }
    setSaving(true);
    try {
      // Only send keys that were actually edited — not masked values
      const payload: Record<string, string> = {};
      editedKeys.forEach(key => {
        payload[key] = (keys as any)[key];
      });
      await api.updateSettings(payload);
      toast.success('API Keys updated successfully');
      setEditedKeys(new Set());
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-display font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Manage your AI provider credentials and other preferences.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                AI Provider Keys
              </CardTitle>
              <CardDescription>
                Enter your API keys to enable real AI capabilities. Keys are stored securely.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                <div className="relative">
                  <Input
                    id="openai_api_key"
                    name="openai_api_key"
                    type="password"
                    placeholder="sk-..."
                    value={keys.openai_api_key || ''}
                    onChange={handleChange}
                  />
                  {keys.openai_api_key && keys.openai_api_key.includes('...') && (
                    <div className="absolute right-3 top-2.5 text-xs text-green-500 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for GPT-4 and ChatGPT models.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini_api_key">Google Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="gemini_api_key"
                    name="gemini_api_key"
                    type="password"
                    placeholder="AIza..."
                    value={keys.gemini_api_key || ''}
                    onChange={handleChange}
                  />
                  {keys.gemini_api_key && keys.gemini_api_key.includes('...') && (
                    <div className="absolute right-3 top-2.5 text-xs text-green-500 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for Gemini Pro models.
                </p>
              </div>

              <div className="space-y-2 opacity-50 pointer-events-none">
                <Label htmlFor="anthropic_api_key">Anthropic API Key (Coming Soon)</Label>
                <Input
                  id="anthropic_api_key"
                  name="anthropic_api_key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={keys.anthropic_api_key || ''}
                  onChange={handleChange}
                  disabled
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 border-t flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </form>

      <motion.div variants={itemVariants}>
        <Card className="mt-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Shield className="w-5 h-5" />
              Security Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your keys are stored securely on the server and are never exposed to the frontend after saving.
              They are only used to communicate directly with the AI providers for your bots.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
