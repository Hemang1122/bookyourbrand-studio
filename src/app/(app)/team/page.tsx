
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Plus, Search, Mail, Eye, Trash2, FolderKanban, Wifi, Shield } from 'lucide-react';
import { useData } from '../data-provider';
import { useAuth } from '@/firebase/provider';
import { useUserStatus } from '@/firebase';
import { redirect } from 'next/navigation';
import { AddUserDialog } from './components/add-user-dialog';
import { ViewTeamMemberDetailsDialog } from './components/view-team-member-details-dialog';
import type { User } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TeamMemberCard = ({ member, projects, isAdmin, onDelete }: { member: User, projects: any[], isAdmin: boolean, onDelete: (id: string) => void }) => {
    const userStatus = useUserStatus(member.id);
    const avatarUrl = (member as any).photoURL || PlaceHolderImages.find(p => p.id === member.avatar)?.imageUrl;
    const projectCount = projects.filter(p => p.team_ids?.includes(member.id)).length;
    
    return (
        <div className="group rounded-2xl p-5 bg-[#13131F] border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={avatarUrl} alt={member.name} />
                            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200">
                                {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#13131F]", userStatus?.isOnline ? "bg-green-400" : "bg-gray-500")} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{member.name}</h3>
                        <p className="text-xs text-muted-foreground">{userStatus?.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                </div>

                <span className={cn("text-xs px-2.5 py-1 rounded-full border", member.role === 'admin' ? "bg-pink-500/15 text-pink-300 border-pink-500/20" : "bg-purple-500/15 text-purple-300 border-purple-500/20")}>
                    {member.role}
                </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{member.email}</span>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{projectCount} active projects</span>
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/5">
                <ViewTeamMemberDetailsDialog teamMember={member}>
                    <Button variant="outline" size="sm" className="flex-1 border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white text-xs">
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View Details
                    </Button>
                </ViewTeamMemberDetailsDialog>
                 {isAdmin && member.role !== 'admin' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-red-500/20 hover:bg-red-500/10 text-red-400 px-3">
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete {member.name}'s account. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(member.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
};

export default function TeamPage() {
  const { user } = useAuth();
  const { teamMembers, projects, deleteUser, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  if (user?.role !== 'admin') {
    if (typeof window !== 'undefined') {
      redirect('/dashboard');
    }
    return null;
  }
  
  const onlineCount = useMemo(() => teamMembers.filter(m => {
    // This is a rough check. useUserStatus provides live data.
    // This is for the summary card only.
    return m.isOnline;
  }).length, [teamMembers]);

  const filteredTeam = useMemo(() => {
    if (!teamMembers) return [];
    if (!searchQuery) return teamMembers;
    return teamMembers.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamMembers, searchQuery]);
  
  const stats = [
    { label: 'Total Members', value: teamMembers.length, color: '#A78BFA', icon: Users },
    { label: 'Online Now', value: onlineCount, color: '#34D399', icon: Wifi },
    { label: 'Admins', value: teamMembers.filter(m => m.role === 'admin').length, color: '#F472B6', icon: Shield },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="relative z-10 flex items-center justify-between">
              <div>
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500">
                          <Users className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold text-white">Team & User Management</h1>
                  </div>
                  <p className="text-muted-foreground ml-14">{teamMembers.length} members</p>
              </div>
              <AddUserDialog>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                  </Button>
              </AddUserDialog>
          </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl p-4 flex items-center gap-4 bg-[#13131F] border border-white/5">
            <div className="p-2 rounded-lg" style={{background: stat.color + '20'}}>
              <stat.icon className="h-5 w-5" style={{color: stat.color}} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      
       <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Search by name or email..."
              className="pl-10 rounded-full bg-white/5 border-white/10 text-white focus-visible:ring-purple-500/30 focus-visible:border-purple-500/50 w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
          />
      </div>

       {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({length:3}).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl bg-[#13131F]" />)}
        </div>
       ) : filteredTeam.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeam.map(member => (
              <TeamMemberCard key={member.id} member={member} projects={projects} isAdmin={user.role === 'admin'} onDelete={deleteUser} />
            ))}
          </div>
        ) : (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-purple-500/10 border border-purple-500/20">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No team members found</h3>
          </div>
        )}
    </div>
  );
}
