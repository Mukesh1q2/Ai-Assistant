import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Copy,
  Check,
  Variable,
  Sparkles,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { PromptTemplate } from '@/types';

interface PromptTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PromptTemplate[];
  onUpdate: (templates: PromptTemplate[]) => void;
}

const defaultTemplates: PromptTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Email Response',
    template: `You are an email assistant. Draft a professional response to the following email.

Context: {{context}}
Sender: {{sender}}
Subject: {{subject}}

Guidelines:
- Keep it concise and professional
- Address all points in the original email
- Use a {{tone}} tone`,
    variables: ['context', 'sender', 'subject', 'tone'],
  },
  {
    id: 'tpl-2',
    name: 'Calendar Event Summary',
    template: `Summarize the following calendar event for the user:

Event: {{eventTitle}}
Date: {{date}}
Attendees: {{attendees}}
Description: {{description}}

Provide a brief summary including key points and any action items.`,
    variables: ['eventTitle', 'date', 'attendees', 'description'],
  },
  {
    id: 'tpl-3',
    name: 'Smart Home Command',
    template: `Process this smart home command: "{{command}}"

Current state:
- Location: {{location}}
- Time: {{time}}
- User preferences: {{preferences}}

Execute the appropriate action and confirm what was done.`,
    variables: ['command', 'location', 'time', 'preferences'],
  },
];

const variableColors = [
  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'bg-violet-500/10 text-violet-500 border-violet-500/20',
  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'bg-rose-500/10 text-rose-500 border-rose-500/20',
  'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
];

export default function PromptTemplateEditor({
  isOpen,
  onClose,
  templates: externalTemplates,
  onUpdate,
}: PromptTemplateEditorProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(
    externalTemplates.length > 0 ? externalTemplates : defaultTemplates
  );
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState<Partial<PromptTemplate>>({
    name: '',
    template: '',
    variables: [],
  });

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches.map((m) => m.slice(2, -2)))] : [];
  };

  const handleCreate = () => {
    if (!newTemplate.name || !newTemplate.template) {
      toast.error('Please fill in all fields');
      return;
    }

    const variables = extractVariables(newTemplate.template);
    const template: PromptTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplate.name,
      template: newTemplate.template,
      variables,
    };

    const updated = [...templates, template];
    setTemplates(updated);
    onUpdate(updated);
    setIsCreating(false);
    setNewTemplate({ name: '', template: '', variables: [] });
    toast.success('Template created');
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;

    const variables = extractVariables(selectedTemplate.template);
    const updated = templates.map((t) =>
      t.id === selectedTemplate.id ? { ...selectedTemplate, variables } : t
    );
    setTemplates(updated);
    onUpdate(updated);
    setIsEditing(false);
    toast.success('Template updated');
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    onUpdate(updated);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }
    toast.success('Template deleted');
  };

  const handleCopy = async (template: PromptTemplate) => {
    await navigator.clipboard.writeText(template.template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const insertVariable = (variable: string) => {
    if (isEditing && selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        template: selectedTemplate.template + ` {{${variable}}}`,
      });
    } else if (isCreating) {
      setNewTemplate({
        ...newTemplate,
        template: (newTemplate.template || '') + ` {{${variable}}}`,
      });
    }
  };

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
          className="relative w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-primary/25">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Prompt Templates</h2>
                <p className="text-sm text-muted-foreground">
                  {templates.length} templates • Manage bot instructions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isCreating && !selectedTemplate && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[70vh]">
            {/* Sidebar - Template List */}
            {!selectedTemplate && !isCreating && (
              <div className="w-full p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(template);
                              }}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              {copiedId === template.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(template.id);
                              }}
                              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-medium text-foreground mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {template.template.substring(0, 100)}...
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((v, i) => (
                            <Badge
                              key={v}
                              variant="outline"
                              className={`text-xs ${variableColors[i % variableColors.length]}`}
                            >
                              {v}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Create/Edit Form */}
            {(isCreating || selectedTemplate) && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-6 overflow-y-auto">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedTemplate(null);
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <X className="w-4 h-4" />
                    Back to templates
                  </button>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input
                        value={isCreating ? newTemplate.name || '' : selectedTemplate?.name || ''}
                        onChange={(e) =>
                          isCreating
                            ? setNewTemplate({ ...newTemplate, name: e.target.value })
                            : setSelectedTemplate(
                                selectedTemplate
                                  ? { ...selectedTemplate, name: e.target.value }
                                  : null
                              )
                        }
                        placeholder="e.g., Email Response"
                        disabled={!isCreating && !isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Template Content</Label>
                        <span className="text-xs text-muted-foreground">
                          Use {'{{variable}}'} for dynamic content
                        </span>
                      </div>
                      <Textarea
                        value={
                          isCreating
                            ? newTemplate.template || ''
                            : selectedTemplate?.template || ''
                        }
                        onChange={(e) =>
                          isCreating
                            ? setNewTemplate({ ...newTemplate, template: e.target.value })
                            : setSelectedTemplate(
                                selectedTemplate
                                  ? { ...selectedTemplate, template: e.target.value }
                                  : null
                              )
                        }
                        placeholder="Enter your prompt template..."
                        className="min-h-[300px] font-mono text-sm"
                        disabled={!isCreating && !isEditing}
                      />
                    </div>

                    {/* Quick Variables */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Variable className="w-4 h-4" />
                        Quick Insert Variables
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'userName',
                          'context',
                          'timestamp',
                          'location',
                          'preferences',
                          'history',
                        ].map((v) => (
                          <button
                            key={v}
                            onClick={() => insertVariable(v)}
                            disabled={!isCreating && !isEditing}
                            className="px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detected Variables */}
                    <div className="space-y-2">
                      <Label>Detected Variables</Label>
                      <div className="flex flex-wrap gap-2">
                        {(isCreating
                          ? extractVariables(newTemplate.template || '')
                          : selectedTemplate?.variables || []
                        ).map((v, i) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className={`${variableColors[i % variableColors.length]}`}
                          >
                            {v}
                          </Badge>
                        ))}
                        {(isCreating
                          ? extractVariables(newTemplate.template || '')
                          : selectedTemplate?.variables || []
                        ).length === 0 && (
                          <span className="text-sm text-muted-foreground">
                            No variables detected. Use {'{{variableName}}'} syntax.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    {!isCreating && selectedTemplate && (
                      <Card className="bg-muted/50 border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedTemplate.template}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedTemplate(null);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  {selectedTemplate && !isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {(isCreating || isEditing) && (
                    <Button
                      onClick={isCreating ? handleCreate : handleUpdate}
                      className="bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isCreating ? 'Create' : 'Save'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
