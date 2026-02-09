import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  MoreVertical,
  Shield,
  Mail,
  X,
  UserPlus,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFamilyStore, useAuthStore } from '@/store';

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

export default function FamilyPanel() {
  const { members, inviteMember, removeMember, updateMemberRole } = useFamilyStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    await inviteMember(inviteEmail, inviteRole);
    setInviting(false);
    setInviteEmail('');
    setInviteDialogOpen(false);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText('https://clawd.ai/invite/family-abc123');
    setInviteLinkCopied(true);
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-500">Owner</span>;
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-500">Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Member</span>;
    }
  };

  const isOwner = user?.role === 'owner';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Family</h1>
          <p className="text-muted-foreground">
            {members.length} members in your family
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Family Member</DialogTitle>
              <DialogDescription>
                Invite someone to join your family and share automations.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email Address</label>
                <Input 
                  type="email"
                  placeholder="family@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member - Can use shared bots</SelectItem>
                    <SelectItem value="admin">Admin - Can manage bots and members</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Or share invite link</p>
                <div className="flex gap-2">
                  <Input 
                    value="https://clawd.ai/invite/family-abc123"
                    readOnly
                    className="bg-background"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyInviteLink}
                  >
                    {inviteLinkCopied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviting}
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Members Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="group hover:border-primary/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="gradient-ai text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      {member.userId === user?.id && (
                        <span className="px-2 py-0.5 rounded text-xs border">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(member.role)}
                    </div>
                  </div>
                </div>
                {isOwner && member.userId !== user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, member.role === 'admin' ? 'member' : 'admin')}>
                        <Shield className="w-4 h-4 mr-2" />
                        {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-500"
                        onClick={() => removeMember(member.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {member.email}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredMembers.length === 0 && (
        <motion.div 
          variants={itemVariants}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No members found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Invite your family members to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          )}
        </motion.div>
      )}

      {/* Shared Packs Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-lg font-semibold">Shared Automations</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Family Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Smart Home and Family Notification packs are shared with all family members
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500">
                Active
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
