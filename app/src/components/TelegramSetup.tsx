/**
 * TelegramSetup Component
 * Step-by-step wizard for connecting a Telegram bot via BotFather, now fully modular
 */

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageCircle, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/services/api';
import {
    CreateBotStep,
    EnterTokenStep,
    ConfigureWebhookStep,
    CompleteStep
} from './telegram/TelegramSteps';

interface TelegramSetupProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (integration: any) => void;
}

const steps = [
    { id: 1, title: 'Create Bot' },
    { id: 2, title: 'Enter Token' },
    { id: 3, title: 'Configure' },
    { id: 4, title: 'Complete' },
];

export default function TelegramSetup({ isOpen, onClose, onSuccess }: TelegramSetupProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [botToken, setBotToken] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [integration, setIntegration] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard!');
    };

    const validateAndConnect = async () => {
        if (!botToken.trim()) {
            setError('Please enter your bot token');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            const response = await api.post('/platforms/telegram/setup', {
                botToken: botToken.trim(),
                webhookBaseUrl: webhookUrl.trim() || undefined,
            }) as any;

            if (response.success && response.integration) {
                setIntegration(response.integration);
                setCurrentStep(4);
                toast.success('Telegram bot connected successfully!');
            } else {
                setError(response.error || 'Failed to connect bot');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to validate token');
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
        setBotToken('');
        setWebhookUrl('');
        setError(null);
        setIntegration(null);
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <CreateBotStep onNext={nextStep} />;
            case 2:
                return (
                    <EnterTokenStep
                        onNext={nextStep}
                        onBack={prevStep}
                        botToken={botToken}
                        setBotToken={setBotToken}
                        error={error}
                    />
                );
            case 3:
                return (
                    <ConfigureWebhookStep
                        onNext={validateAndConnect}
                        onBack={prevStep}
                        webhookUrl={webhookUrl}
                        setWebhookUrl={setWebhookUrl}
                        isValidating={isValidating}
                        error={error}
                    />
                );
            case 4:
                return (
                    <CompleteStep
                        integration={integration}
                        onComplete={handleComplete}
                        copied={copied}
                        handleCopy={handleCopy}
                    />
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                handleReset();
                onClose();
            }
        }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        Connect Telegram Bot
                    </DialogTitle>
                    <DialogDescription>
                        Connect your Telegram bot to receive and send messages
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
