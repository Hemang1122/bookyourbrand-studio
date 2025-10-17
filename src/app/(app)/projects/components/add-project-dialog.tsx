'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Client, Project, User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { useData } from '../../data-provider';
import { useAuth } from '@/lib/auth-client';

type AddProjectDialogProps = {
  onProjectAdd: (project: Omit<Project, 'id' | 'coverImage'>) => void;
  children: React.ReactNode;
  client?: Client;
};

export function AddProjectDialog({ onProjectAdd, children, client: preselectedClient }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const [client, setClient] = useState<string | undefined>(preselectedClient?.id);
  const [team, setTeam] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { teamMembers, clients, users } = useData();

  const teamMemberOptions = teamMembers.map(tm => ({ value: tm.id, label: tm.name }));
  const isClientUser = user?.role === 'client';

  const handleAddProject = () => {
    const finalClientId = isClientUser ? user?.id : client;

    // Admin validation
    if (!isClientUser && team.length === 0) {
      toast({ title: 'Error', description: 'Please assign at least one team member.', variant: 'destructive' });
      return;
    }
    // Universal validation
    if (!name || !description || !deadline || !finalClientId) {
      toast({ title: 'Error', description: 'Project name, description, client and deadline are required.', variant: 'destructive' });
      return;
    }
    const selectedClient = clients.find(c => c.id === finalClientId);
    if (!selectedClient) {
        toast({ title: 'Error', description: 'Selected client not found.', variant: 'destructive' });
        return;
    }
    
    // Admins assign team, clients submit with their own team (which is empty initially)
    const selectedTeam = isClientUser ? [] : users.filter(u => team.includes(u.id));


    const newProject = {
      name,
      description,
      guidelines,
      deadline: format(deadline, 'yyyy-MM-dd'),
      client: selectedClient,
      team: selectedTeam,
      status: 'Active',
    };
    onProjectAdd(newProject);
    toast({ title: 'Project Added', description: `"${name}" has been created.` });
    setOpen(false);
    // Reset fields
    setName('');
    setDescription('');
    setGuidelines('');
    setDeadline(undefined);
    setClient(preselectedClient?.id);
    setTeam([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Fill in the details for the new project.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q4 Marketing Campaign" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a brief description of the project." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guidelines">Project Guidelines</Label>
            <Textarea id="guidelines" value={guidelines} onChange={(e) => setGuidelines(e.target.value)} placeholder="Provide specific instructions or guidelines for the team." />
          </div>
          {!preselectedClient && !isClientUser && (
            <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select onValueChange={setClient} value={client}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          )}
          {!isClientUser && (
            <div className="space-y-2">
              <Label>Assign Team Members</Label>
              <MultiSelect
                options={teamMemberOptions}
                selected={team}
                onChange={setTeam}
                placeholder="Select team members..."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddProject}>Add Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
