import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Book,
  Video,
  MessageSquare,
  ExternalLink,
  Search,
  X,
  ChevronRight,
  Mail,
  Code,
  Settings,
  Bot,
  Package,
  Users,
  Shield,
  Sparkles,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  icon: React.ElementType;
}

interface HelpDocumentationProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { id: 'getting-started', label: 'Getting Started', icon: Sparkles },
  { id: 'bots', label: 'Bots', icon: Bot },
  { id: 'packs', label: 'Task Packs', icon: Package },
  { id: 'channels', label: 'Channels', icon: MessageSquare },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api', label: 'API', icon: Code },
];

const articles: HelpArticle[] = [
  {
    id: 'what-is-clawd',
    title: 'What is Clawd?',
    category: 'getting-started',
    icon: Sparkles,
    content: `Clawd is an AI Assistant Control Plane that allows you to deploy and manage AI-powered bots for various tasks. Think of it as your central hub for AI automation.

Key Features:
• Deploy bots in seconds with pre-built templates
• Connect bots to multiple channels (Telegram, Discord, Slack, etc.)
• Enable task packs to extend bot capabilities
• Manage family access and permissions
• Monitor performance with analytics`,
  },
  {
    id: 'creating-first-bot',
    title: 'Creating Your First Bot',
    category: 'getting-started',
    icon: Bot,
    content: `To create your first bot:

1. Click the "Create Bot" button on the dashboard
2. Choose a template that matches your needs
3. Configure the bot's name and personality
4. Enable relevant task packs
5. Connect to your preferred channels
6. Deploy and start using!

Your bot will be ready to use within seconds of deployment.`,
  },
  {
    id: 'understanding-task-packs',
    title: 'Understanding Task Packs',
    category: 'packs',
    icon: Package,
    content: `Task packs are collections of tools and capabilities that extend what your bots can do.

Available Categories:
• Productivity - Email, calendar, task management
• Home - Smart home control, reminders
• Family - Shared calendars, chore management
• Health - Wellness tracking, medication reminders
• Entertainment - Media control, recommendations
• Travel - Flight booking, itinerary planning

Enable packs based on your needs. Each pack can be configured with custom permissions and guardrails.`,
  },
  {
    id: 'connecting-channels',
    title: 'Connecting Channels',
    category: 'channels',
    icon: MessageSquare,
    content: `Channels allow your bots to communicate through various platforms.

Supported Channels:
• Telegram - Best for mobile notifications
• Discord - Great for communities and teams
• Slack - Perfect for workplace integration
• WhatsApp - Universal messaging
• Email - Formal communications

To connect a channel:
1. Go to the Channels section
2. Select your platform
3. Follow the authentication steps
4. Configure bot access permissions`,
  },
  {
    id: 'family-sharing',
    title: 'Family Sharing',
    category: 'family',
    icon: Users,
    content: `Share bots and task packs with your family members.

Features:
• Invite family members via email
• Assign roles (Owner, Admin, Member)
• Share specific task packs
• Control access permissions per member
• View family activity logs

Family plans include up to 10 seats with shared quotas.`,
  },
  {
    id: 'guardrails-approvals',
    title: 'Guardrails & Approvals',
    category: 'security',
    icon: Shield,
    content: `Set up guardrails to control what your bots can do.

Guardrail Types:
• Block - Prevent specific actions entirely
• Approve - Require approval for sensitive actions
• Log - Record actions for review

High-risk actions like sending emails, making purchases, or unlocking doors can be configured to require your approval before execution.

You'll receive notifications when approval is needed.`,
  },
  {
    id: 'api-integration',
    title: 'API Integration',
    category: 'api',
    icon: Code,
    content: `Integrate Clawd with your own applications using our REST API.

Authentication:
Use your API key in the Authorization header:
Authorization: Bearer YOUR_API_KEY

Key Endpoints:
• GET /bots - List all bots
• POST /bots - Create a new bot
• GET /bots/:id/execute - Execute a task
• GET /packs - List available packs
• POST /channels/:id/send - Send a message

Full API documentation is available at docs.clawd.ai/api`,
  },
  {
    id: 'customizing-bots',
    title: 'Customizing Bot Personality',
    category: 'bots',
    icon: Settings,
    content: `Customize how your bots communicate and behave.

Personality Settings:
• Tone - Professional, friendly, casual, formal
• Response style - Concise, detailed, bullet points
• Language preferences
• Cultural considerations

Memory & Context:
• User scope - Personal memories
• Family scope - Shared family context
• Global scope - Universal knowledge

Configure these in the bot settings panel.`,
  },
];

const quickLinks = [
  { label: 'Documentation', icon: Book, href: '#' },
  { label: 'Video Tutorials', icon: Video, href: '#' },
  { label: 'Community Forum', icon: MessageSquare, href: '#' },
  { label: 'Contact Support', icon: Mail, href: '#' },
];

export default function HelpDocumentation({ isOpen, onClose }: HelpDocumentationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.label || categoryId;
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
          className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-primary/25">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Help & Documentation</h2>
                <p className="text-sm text-muted-foreground">Find answers and learn about Clawd</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[70vh]">
            {/* Sidebar */}
            {!selectedArticle && (
              <div className="w-64 border-r border-border p-4 hidden sm:block overflow-y-auto">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      selectedCategory === null
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Book className="w-4 h-4" />
                    <span className="text-sm">All Articles</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <category.icon className="w-4 h-4" />
                      <span className="text-sm">{category.label}</span>
                    </button>
                  ))}
                </div>

                {/* Quick Links */}
                <div className="mt-8 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                    Quick Links
                  </p>
                  <div className="space-y-1">
                    {quickLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                      >
                        <link.icon className="w-4 h-4" />
                        <span className="text-sm">{link.label}</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedArticle ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to articles
                  </button>

                  <div>
                    <Badge variant="secondary" className="mb-3">
                      {getCategoryLabel(selectedArticle.category)}
                    </Badge>
                    <h1 className="text-2xl font-display font-bold text-foreground mb-4">
                      {selectedArticle.title}
                    </h1>
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                      {selectedArticle.content}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">Was this article helpful?</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success('Thank you for your feedback!')}
                      >
                        Yes, it helped
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('We will improve this article')}
                      >
                        No, I need more help
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search for help..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Getting Started Card */}
                  {!searchQuery && !selectedCategory && (
                    <Card className="bg-gradient-to-r from-[#4F8CFF]/10 to-[#7C5CFF]/10 border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Play className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              New to Clawd?
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              Watch our quick start guide to learn the basics in under 5 minutes.
                            </p>
                            <Button variant="secondary" size="sm">
                              <Video className="w-4 h-4 mr-2" />
                              Watch Tutorial
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => (
                      <Card
                        key={article.id}
                        className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <article.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge variant="secondary" className="text-xs mb-2">
                                {getCategoryLabel(article.category)}
                              </Badge>
                              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {article.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {article.content.substring(0, 100)}...
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredArticles.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or browse by category
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
