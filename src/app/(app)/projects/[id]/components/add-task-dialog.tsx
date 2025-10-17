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
import { summarizeProjectBrief, SummarizeProjectBriefOutput } from '@/ai/flows/ai-powered-task-summarization';
import { Wand2, Plus, Bot, Loader2 } from 'lucide-react';
import { users } from '@/lib/data';
import type { Task } from '@/lib/types';
import { Input } from '@/components/ui/input';

type AddTaskDialogProps = {
  projectId: string;
  onTaskAdd: (task: Task) => void;
  children: React.ReactNode;
};

export function AddTaskDialog({ projectId, onTaskAdd, children }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState('');
  const [aiResult, setAiResult] = useState<SummarizeProjectBriefOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!brief) {
      toast({ title: 'Error', description: 'Project brief cannot be empty.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await summarizeProjectBrief({ projectBrief: brief });
      setAiResult(result);
    } catch (error) {
      console.error(error);
      toast({ title: 'AI Error', description: 'Failed to summarize the brief.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = (title: string, description: string) => {
    const newTask: Task = {
        id: `task-${Date.now()}`,
        projectId: projectId,
        title,
        description,
        assignedTo: users.find(u => u.role === 'team')!, // Mock assignment
        status: 'Pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 week from now
    };
    onTaskAdd(newTask);
    toast({ title: 'Task Added', description: `"${title}" has been added to the project.` });
    setOpen(false); // Close dialog after adding
    // Reset fields
    setAiResult(null);
    setBrief('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Manually add a task or use AI to generate tasks from a project brief.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" placeholder="e.g., Design new logo concept" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Provide a detailed description of the task." />
          </div>
           <DialogFooter>
            <Button onClick={() => {
                const title = (document.getElementById('title') as HTMLInputElement).value;
                const description = (document.getElementById('description') as HTMLTextAreaElement).value;
                if(title && description) {
                    handleAddTask(title, description);
                } else {
                    toast({ title: 'Error', description: 'Title and description are required.', variant: 'destructive' });
                }
            }}>Add Manually</Button>
        </DialogFooter>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or Use AI</span>
            </div>
        </div>

          <div className="space-y-2">
            <Label htmlFor="brief">Project Brief</Label>
            <Textarea
              id="brief"
              placeholder="Paste a detailed project brief here and let AI suggest tasks."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
            />
          </div>
          <Button onClick={handleSummarize} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Tasks with AI
          </Button>

          {aiResult && (
            <div className="mt-4 space-y-4 rounded-lg border bg-muted/50 p-4">
                <h4 className="font-semibold flex items-center"><Bot className="mr-2 h-5 w-5 text-primary" /> AI Suggestions</h4>
                <div className="space-y-1">
                    <h5 className="font-medium text-sm">Summary</h5>
                    <p className="text-sm text-muted-foreground">{aiResult.summary}</p>
                </div>
                <div className="space-y-2">
                    <h5 className="font-medium text-sm">Suggested Tasks</h5>
                    {aiResult.suggestedTasks.map((task, index) => (
                        <div key={index} className="flex items-start justify-between gap-2 rounded-md border bg-background p-3">
                            <div className="space-y-1">
                                <p className="font-semibold text-sm">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleAddTask(task.title, task.description)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
