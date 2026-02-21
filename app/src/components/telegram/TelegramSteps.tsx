import { motion } from 'framer-motion';
import {
    MessageCircle,
    ExternalLink,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    Loader2,
    CheckCircle,
    Check,
    Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StepProps {
    onNext?: () => void;
    onBack?: () => void;
}

export function CreateBotStep({ onNext }: StepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center py-4">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create a Telegram Bot</h3>
                <p className="text-muted-foreground text-sm">
                    Follow these steps to create your bot on Telegram
                </p>
            </div>

            <div className="space-y-4 bg-muted/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <div>
                        <p className="font-medium">Open BotFather on Telegram</p>
                        <p className="text-sm text-muted-foreground">Search for @BotFather or click the link below</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <div>
                        <p className="font-medium">Send /newbot command</p>
                        <p className="text-sm text-muted-foreground">BotFather will guide you through the setup</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <div>
                        <p className="font-medium">Copy the API Token</p>
                        <p className="text-sm text-muted-foreground">You'll receive a token like: <code className="bg-muted px-1 rounded">123456:ABC-DEF...</code></p>
                    </div>
                </div>
            </div>

            <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
                Open BotFather
                <ExternalLink className="w-4 h-4" />
            </a>

            <Button className="w-full" onClick={onNext}>
                I have my token
                <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </motion.div>
    );
}

interface EnterTokenStepProps extends StepProps {
    botToken: string;
    setBotToken: (token: string) => void;
    error: string | null;
}

export function EnterTokenStep({ onNext, onBack, botToken, setBotToken, error }: EnterTokenStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center py-4">
                <h3 className="text-lg font-semibold mb-2">Enter Bot Token</h3>
                <p className="text-muted-foreground text-sm">
                    Paste the API token you received from BotFather
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Bot Token</label>
                    <Input
                        type="password"
                        placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Your token is encrypted and stored securely
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button className="flex-1" onClick={onNext} disabled={!botToken.trim()}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </motion.div>
    );
}

interface ConfigureWebhookStepProps extends StepProps {
    webhookUrl: string;
    setWebhookUrl: (url: string) => void;
    isValidating: boolean;
    error: string | null;
}

export function ConfigureWebhookStep({ onNext, onBack, webhookUrl, setWebhookUrl, isValidating, error }: ConfigureWebhookStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center py-4">
                <h3 className="text-lg font-semibold mb-2">Configure Webhook (Optional)</h3>
                <p className="text-muted-foreground text-sm">
                    Provide your server's public URL for real-time messages
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Webhook Base URL</label>
                    <Input
                        placeholder="https://your-server.com"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Leave empty for now if you don't have a public URL. Use ngrok for local testing.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        <strong>Tip:</strong> For local development, use ngrok to create a public URL:
                    </p>
                    <code className="block mt-2 text-xs bg-muted p-2 rounded">
                        ngrok http 3001
                    </code>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button className="flex-1" onClick={onNext} disabled={isValidating}>
                    {isValidating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            Connect Bot
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}

interface CompleteStepProps {
    integration: any;
    onComplete: () => void;
    copied: boolean;
    handleCopy: (val: string) => void;
}

export function CompleteStep({ integration, onComplete, copied, handleCopy }: CompleteStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Bot Connected!</h3>
                <p className="text-muted-foreground text-sm">
                    Your Telegram bot is now ready to receive messages
                </p>
            </div>

            {integration && (
                <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bot Username</span>
                        <span className="font-medium">@{integration.botUsername}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500">
                            Connected
                        </span>
                    </div>
                    {integration.webhookUrl && (
                        <div>
                            <span className="text-sm text-muted-foreground block mb-1">Webhook URL</span>
                            <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                    {integration.webhookUrl}
                                </code>
                                <button
                                    onClick={() => handleCopy(integration.webhookUrl)}
                                    className="p-1.5 rounded hover:bg-muted"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>Next:</strong> Open Telegram and send a message to your bot to test it!
                </p>
            </div>

            <Button className="w-full" onClick={onComplete}>
                Done
            </Button>
        </motion.div>
    );
}
