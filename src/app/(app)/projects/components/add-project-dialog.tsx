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
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Client, Project, User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UpgradeDialog } from '../../settings/billing/components/upgrade-dialog';
import { useFirebaseServices } from '@/firebase';
import { checkPackageLimit, incrementPackageUsage } from '@/lib/package-utils';

type AddProjectDialogProps = {
  onProjectAdd: (project: Omit<Project, 'id' | 'coverImage'>) => void;
  children: React.ReactNode;
  client?: Client | null;
};

export function AddProjectDialog({ onProjectAdd, children, client: preselectedClient }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(preselectedClient?.id);
  const [team_ids, setTeamIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { teamMembers, clients } = useData();
  const { firestore } = useFirebaseServices();

  const teamMemberOptions = teamMembers.map(tm => ({ value: tm.id, label: tm.name }));
  const isClientUser = currentUser?.role === 'client';

  let clientForProject: Client | undefined;
  if (isClientUser) {
    clientForProject = clients.find(c => c.id === currentUser.id);
  } else {
    clientForProject = clients.find(c => c.id === selectedClientId);
  }
  
  const handleAddProject = async () => {
    if (!firestore || !currentUser || !clientForProject) {
        toast({ title: 'Error', description: 'Information missing. Please try again.', variant: 'destructive' });
        return;
    }

    // Check if client can create a project based on package limits
    const packageCheck = await checkPackageLimit(firestore, clientForProject.id);
    if (!packageCheck.canCreate) {
      toast({ 
        title: 'Cannot Create Project', 
        description: packageCheck.message, 
        variant: 'destructive' 
      });
      return;
    }

    if (!name || !description || !deadline) {
      toast({ title: 'Error', description: 'Name, description, and deadline are required.', variant: 'destructive' });
      return;
    }

    if (!isClientUser && team_ids.length === 0) {
      toast({ title: 'Error', description: 'Please assign at least one team member.', variant: 'destructive' });
      return;
    }
    
    const selectedTeamIds = isClientUser ? [] : team_ids;

    const newProject = {
      name,
      description,
      guidelines,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      deadline: format(deadline, 'yyyy-MM-dd'),
      client: clientForProject,
      team_ids: selectedTeamIds,
      status: 'Active' as const,
    };

    try {
      // Create project
      onProjectAdd(newProject);
      
      // Increment package usage
      const result = await incrementPackageUsage(firestore, clientForProject.id);
      if (result.success) {
        toast({ 
          title: 'Project Created', 
          description: result.message 
        });
      }

      setOpen(false);
      // Reset fields
      setName('');
      setDescription('');
      setGuidelines('');
      setDeadline(undefined);
      setSelectedClientId(preselectedClient?.id);
      setTeamIds([]);
    } catch (error: any) {
      console.error("Project creation failed", error);
    }
  };

  const currentClientData = clients.find(c => c.id === (isClientUser ? currentUser?.id : selectedClientId));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Fill in the details for the new project. You can set the start date after creation.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {selectedClientId && !currentClientData?.currentPackage && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-orange-400">
                  ⚠️ This client has no active package. They need to select a package first.
                </p>
              </div>
            )}

            {currentClientData?.currentPackage && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-400">
                  Package: <strong>{currentClientData.currentPackage.packageName}</strong> · 
                  Remaining: <strong>{currentClientData.currentPackage.numberOfReels - currentClientData.currentPackage.reelsUsed} reels</strong>
                </p>
              </div>
            )}

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
          {!isClientUser && (
            <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name || c.email?.split('@')[0]}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          )}
          {!isClientUser && (
            <div className="space-y-2">
              <Label>Assign Team Members (initial)</Label>
              <MultiSelect
                options={teamMemberOptions}
                selected={team_ids}
                onChange={setTeamIds}
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
          <Button onClick={handleAddProject} disabled={!currentClientData?.currentPackage || (currentClientData.currentPackage.reelsUsed >= currentClientData.currentPackage.numberOfReels)}>
            Add Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
