
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase/provider';
import { useData } from '../data-provider';
import { format, isSameDay } from 'date-fns';
import { redirect, useRouter } from 'next/navigation';
import { CalendarDays, Search, Users, Calendar as CalendarIcon, X as CalendarX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { User, ProjectStatus } from '@/lib/types';
import { useUserStatus } from '@/firebase';

export default function SchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { projects, users } = useData();

  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const teamMembers = useMemo(() => {
    return (users || []).filter(u => u.role === 'team' || u.role === 'admin')
  }, [users]);
  
  const filteredMembers = useMemo(() => {
    if (!teamMembers) return [];
    return teamMembers.filter(u =>
      u.name.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [teamMembers, memberSearch]);

  const assignedProjects = useMemo(() => {
    if (!selectedMember || !selectedDate) return [];
    return (projects || []).filter(p =>
      p.team_ids?.includes(selectedMember.id) &&
      p.startDate &&
      isSameDay(new Date(p.startDate), selectedDate)
    );
  }, [selectedMember, selectedDate, projects]);


  if (user?.role !== 'admin') {
    if (typeof window !== 'undefined') {
      redirect('/dashboard');
    }
    return null;
  }
  
  const getStatusBadgeClasses = (status: ProjectStatus) => {
    switch (status) {
        case 'Active':
            return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        case 'In Progress':
            return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
        case 'Approved':
        case 'Completed':
            return 'bg-green-500/15 text-green-400 border-green-500/30';
        case 'Rework':
            return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
        case 'On Hold':
             return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
        default:
            return 'bg-secondary text-secondary-foreground';
    }
}

const MemberListItem = ({ member, isSelected, onSelect }: { member: User, isSelected: boolean, onSelect: (member: User) => void }) => {
    const userStatus = useUserStatus(member.id);
    return (
        <button
            key={member.id}
            onClick={() => onSelect(member)}
            className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
            isSelected
                ? "bg-gradient-to-r from-purple-600/20 to-pink-500/20 border border-purple-500/30"
                : "hover:bg-white/5 border border-transparent"
            )}
        >
            <div className="relative shrink-0">
            <Avatar className="h-8 w-8">
                <AvatarFallback className={cn(
                "text-xs font-bold",
                isSelected
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    : "bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200"
                )}>
                {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
             <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5",
                "rounded-full border-2 border-[#13131F]",
                userStatus?.isOnline ? "bg-green-400" : "bg-gray-500"
              )} />
            </div>
            <div className="flex-1 min-w-0">
            <p className={cn(
                "text-sm font-medium truncate",
                isSelected ? "text-white" : "text-gray-300"
            )}>
                {member.name}
            </p>
             <p className="text-xs text-muted-foreground">
                {userStatus?.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            {isSelected && (
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            )}
        </button>
    )
}


  return (
    <div className="container mx-auto py-10">
      <div className="relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-purple-500 to-pink-500" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Team Schedule</h1>
          </div>
          <p className="text-muted-foreground ml-14">
            View project assignments for each team member by date
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_350px_1fr] gap-6">
        
        {/* Team Member List */}
        <div className="rounded-2xl p-5 bg-[#13131F] border border-white/5 h-fit">
          <h3 className="text-white font-semibold mb-1">Team Members</h3>
          <p className="text-xs text-muted-foreground mb-4">Select a member to view schedule</p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-8 text-xs rounded-lg bg-white/5 border-white/10 text-white"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filteredMembers.map(member => (
              <MemberListItem
                key={member.id}
                member={member}
                isSelected={selectedMember?.id === member.id}
                onSelect={setSelectedMember}
              />
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl p-5 bg-[#13131F] border border-white/5 h-fit">
          <h3 className="text-white font-semibold mb-1">Select Date</h3>
          <p className="text-xs text-muted-foreground mb-4">Pick a day to view assignments</p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="p-0"
            classNames={{
              caption_label: "text-white font-bold",
              nav_button: "hover:bg-white/10 text-white",
              head_cell: "text-muted-foreground uppercase text-xs",
              day: "hover:bg-purple-500/10 rounded-lg text-white",
              day_selected: "bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg",
              day_today: "border border-purple-500/50 text-purple-300",
              day_outside: "text-white/30",
            }}
          />
        </div>

        {/* Schedule Results */}
        <div>
          {!selectedMember ? (
            <div className="rounded-2xl bg-[#13131F] border border-white/5 flex flex-col items-center justify-center py-20 text-center h-full">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-purple-500/10 border border-purple-500/20">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Select a team member</h3>
              <p className="text-gray-500 text-sm">Choose from the list on the left to view their schedule</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#13131F] border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-gradient-to-r from-purple-900/10 to-pink-900/10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                      {selectedMember.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">{selectedMember.name}'s Schedule</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedDate ? format(selectedDate, 'EEEE, MMMM do yyyy') : 'All upcoming assignments'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {assignedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarX className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-white font-medium mb-1">No assignments</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.name} has no projects starting on this date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedProjects.map(project => (
                      <div key={project.id} className="rounded-xl p-4 bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition-all group">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-white group-hover:text-purple-300 transition-colors">
                              {project.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Client: {project.client?.name}</p>
                          </div>
                          <span className={cn("text-xs px-2.5 py-1 rounded-full border", getStatusBadgeClasses(project.status))}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Started: {format(new Date(project.startDate), 'MMM d')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs ml-auto text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            View Project →
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
