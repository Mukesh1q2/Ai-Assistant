/**
 * WhatsAppSetup Component
 * Step-by-step wizard for connecting WhatsApp Business API, now fully modular
 */

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageSquare, Check } from 'lucide-react';
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
    MetaSetupStep,
    CredentialsStep,
    WebhookStep,
    CompleteStep
} from './whatsapp/WhatsAppSteps';

interface WhatsAppSetupProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (integration: any) => void;
}

const steps = [
    { id: 1, title: 'Meta Setup' },
    { id: 2, title: 'Credentials' },
    { id: 3, title: 'Webhook' },
    { id: 4, title: 'Complete' },
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

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <MetaSetupStep onNext={nextStep} />;
            case 2:
                return (
                    <CredentialsStep
                        onNext={nextStep}
                        onBack={prevStep}
                        phoneNumberId={phoneNumberId}
                        setPhoneNumberId={setPhoneNumberId}
                        accessToken={accessToken}
                        setAccessToken={setAccessToken}
                        businessAccountId={businessAccountId}
                        setBusinessAccountId={setBusinessAccountId}
                    />
                );
            case 3:
                return (
                    <WebhookStep
                        onNext={validateAndConnect}
                        onBack={prevStep}
                        verifyToken={verifyToken}
                        setVerifyToken={setVerifyToken}
                        generateVerifyToken={generateVerifyToken}
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
