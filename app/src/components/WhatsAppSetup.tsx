/**
 * WhatsAppSetup Component
 * Step-by-step wizard for connecting WhatsApp Business API
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Copy,
    Check,
    ExternalLink,
    AlertCircle,
    Loader2,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface WhatsAppSetupProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (integration: any) => void;
}

const steps = [
    { id: 1, title: 'Meta Setup', description: 'Create Meta Developer App' },
    { id: 2, title: 'Credentials', description: 'Enter API credentials' },
    { id: 3, title: 'Webhook', description: 'Configure webhook' },
    { id: 4, title: 'Complete', description: 'Ready to send messages!' },
];

export default function WhatsAppSetup({ isOpen, onClose, onSuccess }: WhatsAppSetupProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [businessAccountId, setBusinessAccountId] = useState('');
    const [verifyToken, setVerifyToken] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [integration, setIntegration] = useState<any>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
        toast.success('Copied to clipboard!');
    };

    const generateVerifyToken = () => {
        const token = 'clawd_' + Math.random().toString(36).substring(2, 15);
        setVerifyToken(token);
    };

    const validateAndConnect = async () => {
        if (!phoneNumberId.trim() || !accessToken.trim()) {
            setError('Phone Number ID and Access Token are required');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            const response = await api.post('/platforms/whatsapp/setup', {
                phoneNumberId: phoneNumberId.trim(),
                accessToken: accessToken.trim(),
                businessAccountId: businessAccountId.trim() || undefined,
                verifyToken: verifyToken.trim() || undefined,
            }) as any;

            if (response.success && response.integration) {
                setIntegration(response.integration);
                setCurrentStep(4);
                toast.success('WhatsApp connected successfully!');
            } else {
                setError(response.error || 'Failed to connect WhatsApp');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to validate credentials');
        } finally {
            setIsValidating(false);
        }
    };

    const handleComplete = () => {
        onSuccess(integration);
        handleReset();
        onClose();
    };

    const handleReset = () => {
        setCurrentStep(1);
        setPhoneNumberId('');
        setAccessToken('');
        setBusinessAccountId('');
        setVerifyToken('');
        setError(null);
        setIntegration(null);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center py-4">
                            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Set Up WhatsApp Business API</h3>
                            <p className="text-muted-foreground text-sm">
                                You'll need a Meta Developer account and WhatsApp Business App
                            </p>
                        </div>

                        <div className="space-y-4 bg-muted/50 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                                <div>
                                    <p className="font-medium">Create Meta Developer Account</p>
                                    <p className="text-sm text-muted-foreground">Go to developers.facebook.com and sign up</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                                <div>
                                    <p className="font-medium">Create a Business App</p>
                                    <p className="text-sm text-muted-foreground">Select "Business" type and add WhatsApp product</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                                <div>
                                    <p className="font-medium">Get API Credentials</p>
                                    <p className="text-sm text-muted-foreground">Find Phone Number ID and Access Token in API Setup</p>
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://developers.facebook.com/apps/create/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                            Open Meta Developer Portal
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        <Button className="w-full" onClick={() => setCurrentStep(2)}>
                            I have my credentials
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center py-4">
                            <h3 className="text-lg font-semibold mb-2">Enter API Credentials</h3>
                            <p className="text-muted-foreground text-sm">
                                Find these in your Meta Developer App &gt; WhatsApp &gt; API Setup
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Phone Number ID *</label>
                                <Input
                                    placeholder="123456789012345"
                                    value={phoneNumberId}
                                    onChange={(e) => setPhoneNumberId(e.target.value)}
                                    className="font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Access Token *</label>
                                <Input
                                    type="password"
                                    placeholder="EAAG..."
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    className="font-mono"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Use a permanent token from System Users for production
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Business Account ID (Optional)</label>
                                <Input
                                    placeholder="987654321098765"
                                    value={businessAccountId}
                                    onChange={(e) => setBusinessAccountId(e.target.value)}
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(1)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => setCurrentStep(3)}
                                disabled={!phoneNumberId.trim() || !accessToken.trim()}
                            >
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center py-4">
                            <h3 className="text-lg font-semibold mb-2">Configure Webhook</h3>
                            <p className="text-muted-foreground text-sm">
                                Set up webhook verification token for receiving messages
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Verify Token</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="your_custom_verify_token"
                                        value={verifyToken}
                                        onChange={(e) => setVerifyToken(e.target.value)}
                                        className="font-mono"
                                    />
                                    <Button variant="outline" onClick={generateVerifyToken}>
                                        Generate
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    This token verifies Meta&apos;s webhook requests
                                </p>
                            </div>

                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    After connecting, configure in Meta Developer Portal:
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Go to WhatsApp &gt; Configuration</li>
                                    <li>Set Callback URL to your webhook endpoint</li>
                                    <li>Enter the Verify Token shown above</li>
                                    <li>Subscribe to "messages" webhook field</li>
                                </ul>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(2)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button className="flex-1" onClick={validateAndConnect} disabled={isValidating}>
                                {isValidating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        Connect WhatsApp
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                );

            case 4:
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
                            <h3 className="text-lg font-semibold mb-2">WhatsApp Connected!</h3>
                            <p className="text-muted-foreground text-sm">
                                Configure the webhook in Meta Developer Portal to receive messages
                            </p>
                        </div>

                        {integration && (
                            <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Phone Number</span>
                                    <span className="font-medium">{integration.phoneNumber}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500">
                                        Connected
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-border">
                                    <span className="text-sm text-muted-foreground block mb-2">Webhook URL</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                            {window.location.origin}{integration.webhookUrl}
                                        </code>
                                        <button
                                            onClick={() => handleCopy(`${window.location.origin}${integration.webhookUrl}`, 'webhook')}
                                            className="p-1.5 rounded hover:bg-muted"
                                        >
                                            {copied === 'webhook' ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-sm text-muted-foreground block mb-2">Verify Token</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                            {integration.verifyToken}
                                        </code>
                                        <button
                                            onClick={() => handleCopy(integration.verifyToken, 'token')}
                                            className="p-1.5 rounded hover:bg-muted"
                                        >
                                            {copied === 'token' ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button className="w-full" onClick={handleComplete}>
                            Done
                        </Button>
                    </motion.div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                        </div>
                        Connect WhatsApp Business
                    </DialogTitle>
                    <DialogDescription>
                        Connect your WhatsApp Business API for messaging
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-6">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {currentStep > step.id ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    step.id
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-8 h-0.5 mx-1 transition-colors ${currentStep > step.id ? 'bg-primary' : 'bg-muted'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
