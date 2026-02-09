import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Mail,
  Home,
  CreditCard,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: string;
  botName: string;
  botAvatar: string;
  action: string;
  resource: string;
  details: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied';
  riskLevel: 'low' | 'medium' | 'high';
}

const mockApprovals: ApprovalRequest[] = [
  {
    id: 'req-1',
    botName: 'Email Assistant',
    botAvatar: '/bots/email-bot.png',
    action: 'send_email',
    resource: 'john@client.com',
    details: 'Sending proposal document to external client',
    requestedAt: new Date(Date.now() - 1000 * 60 * 5),
    status: 'pending',
    riskLevel: 'medium',
  },
  {
    id: 'req-2',
    botName: 'Smart Home Controller',
    botAvatar: '/bots/smarthome-bot.png',
    action: 'unlock_door',
    resource: 'Front Door',
    details: 'Unlock request from unknown device',
    requestedAt: new Date(Date.now() - 1000 * 60 * 15),
    status: 'pending',
    riskLevel: 'high',
  },
  {
    id: 'req-3',
    botName: 'Travel Planner',
    botAvatar: '/bots/travel-bot.png',
    action: 'book_flight',
    resource: 'Delta Airlines',
    details: 'Booking flight to New York - $450',
    requestedAt: new Date(Date.now() - 1000 * 60 * 30),
    status: 'pending',
    riskLevel: 'high',
  },
  {
    id: 'req-4',
    botName: 'Chores Bot',
    botAvatar: '/bots/chores-bot.png',
    action: 'purchase_item',
    resource: 'Amazon',
    details: 'Adding milk to shopping cart - $4.99',
    requestedAt: new Date(Date.now() - 1000 * 60 * 45),
    status: 'approved',
    riskLevel: 'low',
  },
];

const getRiskBadge = (risk: string) => {
  switch (risk) {
    case 'high':
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">High Risk</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium Risk</Badge>;
    default:
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Low Risk</Badge>;
  }
};

const getActionIcon = (action: string) => {
  if (action.includes('email')) return Mail;
  if (action.includes('door') || action.includes('home')) return Home;
  if (action.includes('book') || action.includes('purchase')) return CreditCard;
  return Lock;
};

const formatTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

interface ApprovalWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApprovalWorkflow({ isOpen, onClose }: ApprovalWorkflowProps) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(mockApprovals);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'approved' } : req
    ));
    toast.success('Request approved');
    setSelectedRequest(null);
  };

  const handleDeny = (id: string) => {
    setApprovals(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'denied' } : req
    ));
    toast.error('Request denied');
    setSelectedRequest(null);
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

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
          className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-primary/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Approval Workflow</h2>
                <p className="text-sm text-muted-foreground">
                  {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {selectedRequest ? (
              // Detail View
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to requests
                </button>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <img 
                        src={selectedRequest.botAvatar} 
                        alt={selectedRequest.botName}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{selectedRequest.botName}</h3>
                          {getRiskBadge(selectedRequest.riskLevel)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Requested {formatTime(selectedRequest.requestedAt)}
                        </p>

                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm font-medium text-foreground mb-1">Action</p>
                            <p className="text-sm text-muted-foreground">{selectedRequest.action}</p>
                          </div>

                          <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm font-medium text-foreground mb-1">Resource</p>
                            <p className="text-sm text-muted-foreground">{selectedRequest.resource}</p>
                          </div>

                          <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm font-medium text-foreground mb-1">Details</p>
                            <p className="text-sm text-muted-foreground">{selectedRequest.details}</p>
                          </div>

                          {selectedRequest.riskLevel === 'high' && (
                            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              <p className="text-sm text-red-500">
                                This action requires additional verification due to high risk level.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDeny(selectedRequest.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white"
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </motion.div>
            ) : (
              // List View
              <div className="space-y-3">
                {approvals.filter(a => a.status === 'pending').length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">No pending approval requests</p>
                  </div>
                )}

                {approvals.filter(a => a.status === 'pending').map((request) => {
                  const ActionIcon = getActionIcon(request.action);
                  return (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ActionIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{request.action}</span>
                          {getRiskBadge(request.riskLevel)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{request.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.botName} • {formatTime(request.requestedAt)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  );
                })}

                {/* Recent History */}
                {approvals.filter(a => a.status !== 'pending').length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground mt-6 mb-3">Recent History</h3>
                    {approvals.filter(a => a.status !== 'pending').map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          request.status === 'approved' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                        }`}>
                          {request.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{request.action}</span>
                            <Badge variant={request.status === 'approved' ? 'default' : 'destructive'} className="text-xs">
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {request.botName} • {formatTime(request.requestedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
