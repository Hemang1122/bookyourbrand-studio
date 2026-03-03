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
import type { Client, Project } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { useData } from '../../data-provider';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices } from '@/firebase';
import { checkPackageLimit, incrementPackageUsage } from '@/lib/package-utils';
import { format } from 'date-fns';

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

    if (!name || !description) {
      toast({ title: 'Error', description: 'Name and description are required.', variant: 'destructive' });
      return;
    }

    const newProject = {
      name,
      description,
      guidelines,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      deadline: '', // Deadline is now set during team assignment
      client: clientForProject,
      team_ids: isClientUser ? [] : team_ids,
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
          <DialogDescription>Fill in the details for the new project. Deadline and team will be set by the admin later.</DialogDescription>
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
