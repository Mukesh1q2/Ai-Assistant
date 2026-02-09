import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Zap,
  Shield,
  MessageSquare,
  Calendar,
  Home,
  Users,
  Heart,
  Music,
  Plane,
  Code,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Play,
  Menu,
  X,
  Moon,
  Sun,
  Mail,
  CheckSquare,
  Sun as SunIcon,
  ChevronRight,
  Clock,
  Globe,
  Lock,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store';
import AuthModal from '@/components/AuthModal';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Bots', href: '#bots' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How It Works', href: '#demo' },
];

const botFeatures = [
  {
    icon: Mail,
    name: 'Email Assistant',
    description: 'Automates email management, drafting, and follow-ups',
    color: 'from-blue-500 to-cyan-400'
  },
  {
    icon: Calendar,
    name: 'Calendar Manager',
    description: 'Schedules meetings and manages availability',
    color: 'from-amber-500 to-orange-400'
  },
  {
    icon: CheckSquare,
    name: 'Chores & Shopping',
    description: 'Manages tasks, lists, and household items',
    color: 'from-teal-500 to-emerald-400'
  },
  {
    icon: Home,
    name: 'Smart Home',
    description: 'Controls lights, thermostats, and devices',
    color: 'from-violet-500 to-purple-400'
  },
  {
    icon: Users,
    name: 'Family Coordinator',
    description: 'Sends notifications and coordinates schedules',
    color: 'from-rose-500 to-pink-400'
  },
  {
    icon: SunIcon,
    name: 'Routine Manager',
    description: 'Manages daily routines and habit tracking',
    color: 'from-yellow-500 to-amber-400'
  },
  {
    icon: Heart,
    name: 'Wellness Coach',
    description: 'Tracks fitness, nutrition, and sleep',
    color: 'from-emerald-500 to-green-400'
  },
  {
    icon: Music,
    name: 'Entertainment',
    description: 'Recommends and controls media playback',
    color: 'from-fuchsia-500 to-purple-400'
  },
  {
    icon: Plane,
    name: 'Travel Planner',
    description: 'Books flights, hotels, and creates itineraries',
    color: 'from-indigo-500 to-blue-400'
  },
  {
    icon: Code,
    name: 'Code Assistant',
    description: 'Helps with coding and debugging',
    color: 'from-slate-500 to-gray-400'
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '2 AI Assistants',
      '1,000 executions/month',
      '1 channel (Telegram)',
      '5 Task Packs',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For power users',
    features: [
      '10 AI Assistants',
      '10,000 executions/month',
      '5 channels (all platforms)',
      '20 Task Packs',
      'Priority support',
      'API access',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Family',
    price: '$49',
    period: '/month',
    description: 'For households',
    features: [
      '25 AI Assistants',
      '50,000 executions/month',
      '10 channels',
      '50 Task Packs',
      '10 family seats',
      'Shared automations',
      '24/7 support',
    ],
    cta: 'Start Family Trial',
    popular: false,
  },
  {
    name: 'Custom',
    price: 'Contact',
    period: '',
    description: 'Enterprise solutions',
    features: [
      'Unlimited assistants',
      'Custom execution limits',
      'Unlimited channels',
      'All Task Packs',
      'SSO & SAML',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const workflowSteps = [
  {
    step: 1,
    title: 'Message',
    description: 'User sends a request via any connected channel',
    icon: MessageSquare
  },
  {
    step: 2,
    title: 'Interpret',
    description: 'AI understands intent and context',
    icon: Sparkles
  },
  {
    step: 3,
    title: 'Execute',
    description: 'Performs actions across integrated services',
    icon: Zap
  },
  {
    step: 4,
    title: 'Confirm',
    description: 'Delivers results and awaits next request',
    icon: CheckCircle
  },
];

const coreFeatures = [
  {
    icon: Cpu,
    title: '10+ AI Assistants',
    description: 'Specialized bots for every task from email to smart home control',
  },
  {
    icon: Globe,
    title: 'Multi-Channel',
    description: 'Connect via Telegram, WhatsApp, Discord, Slack, or Email',
  },
  {
    icon: Clock,
    title: 'Under 2 Minutes',
    description: 'Deploy your first AI assistant with just a few clicks',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Approval workflows and guardrails for sensitive actions',
  },
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const openAuth = (view: 'login' | 'signup') => {
    setAuthView(view);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-lg'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-primary/25">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">Clawd</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )}
              </button>
              <Button
                variant="ghost"
                className="hidden sm:flex text-foreground"
                onClick={() => openAuth('login')}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white hover:opacity-90 shadow-lg shadow-primary/25"
                onClick={() => openAuth('signup')}
              >
                Get Started
              </Button>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-foreground" />
                ) : (
                  <Menu className="w-5 h-5 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background border-b border-border"
            >
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href)}
                    className="block w-full text-left py-2 text-muted-foreground hover:text-foreground font-medium"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-3 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuth('login');
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuth('signup');
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#4F8CFF]/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7C5CFF]/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#4F8CFF]/10 to-transparent rounded-full" />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI Assistant Control Plane</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight text-foreground">
              Deploy AI Assistants in{' '}
              <span className="bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] bg-clip-text text-transparent">Under 2 Minutes</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Clawd abstracts away the complexity of OpenClaw. Connect channels, enable automations,
              and let your AI assistants handle the rest.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white hover:opacity-90 px-8 py-6 text-lg group shadow-lg shadow-primary/25"
                onClick={() => openAuth('signup')}
              >
                Deploy Your First Bot
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg group border-2"
                onClick={() => openAuth('login')}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Core Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
              {coreFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground text-sm">{feature.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{feature.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: '10+', label: 'AI Assistants' },
                { value: '50K+', label: 'Executions' },
                { value: '5', label: 'Channels' },
                { value: '<2min', label: 'Deploy Time' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Workflow Section */}
      <section id="demo" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Message → Interpret → Execute → Confirm. Your AI assistants handle complex tasks across multiple services.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 h-full hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm text-primary font-medium mb-2">
                    Step {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Video Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-display font-bold mb-2 text-foreground">
                See It In Action
              </h3>
              <p className="text-muted-foreground">
                Watch how to connect your Telegram bot in just 2 minutes
              </p>
            </div>

            <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
              <video
                src="/demo.mp4"
                controls
                className="w-full aspect-video"
                poster="/demo-poster.jpg"
              >
                Your browser does not support the video tag.
              </video>
              <div className="p-4 bg-muted/30 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Telegram Bot Setup Tutorial</p>
                    <p className="text-xs text-muted-foreground">Deploy your first AI assistant in minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              From household automation to coding assistance, Clawd has you covered with 10 specialized AI assistants.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Home,
                title: 'Household Automation',
                description: 'Manage chores, shopping lists, and smart home devices with intelligent automation.',
              },
              {
                icon: Zap,
                title: 'Smart Home Control',
                description: 'Control lights, thermostats, locks, and scenes with natural language commands.',
              },
              {
                icon: Calendar,
                title: 'Email & Calendar',
                description: 'Automate email responses, schedule meetings, and manage your calendar effortlessly.',
              },
              {
                icon: Users,
                title: 'Family Coordination',
                description: 'Keep everyone in sync with shared notifications, schedules, and task assignments.',
              },
              {
                icon: Heart,
                title: 'Wellness Routines',
                description: 'Track fitness, nutrition, sleep, and maintain healthy habits with AI coaching.',
              },
              {
                icon: Shield,
                title: 'Security & Privacy',
                description: 'Enterprise-grade security with approval workflows for sensitive actions.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bots Section */}
      <section id="bots" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
              10 Specialized AI Assistants
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Each assistant is optimized for specific tasks and can be deployed independently or work together.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {botFeatures.map((bot, index) => (
              <motion.div
                key={bot.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bot.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow`}>
                  <bot.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-1 text-foreground">{bot.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{bot.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 border ${plan.popular
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card/50 backdrop-blur-sm'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-1 text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular
                    ? 'bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white hover:opacity-90'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  onClick={() => openAuth('signup')}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-border/50 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />

            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
              Ready to Deploy Your AI Assistant?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
              Join thousands of users who have transformed their daily workflows with Clawd.
              Deploy your first bot in under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white hover:opacity-90 px-8 shadow-lg shadow-primary/25"
                onClick={() => openAuth('signup')}
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 border-2"
                onClick={() => openAuth('login')}
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-foreground">Clawd</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Docs</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1 text-sm text-muted-foreground">
              <span>© 2024 Clawd. All rights reserved.</span>
              <span>
                Design by{' '}
                <a
                  href="https://theqbitlabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  TheQbitLabs
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultView={authView}
      />
    </div>
  );
}
