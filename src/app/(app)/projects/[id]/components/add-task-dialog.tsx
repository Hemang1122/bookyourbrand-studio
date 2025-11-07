
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
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { summarizeProjectBrief, SummarizeProjectBriefOutput } from '@/ai/flows/ai-powered-task-summarization';
import { Wand2, Plus, Bot, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { format } from 'date-fns';

type AddTaskDialogProps = {
  projectId: string;
  onTaskAdd: (task: Omit<Task, 'id' | 'assignedTo' | 'status' | 'remarks' | 'dueDate'>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddTaskDialog({ projectId, onTaskAdd, open, onOpenChange }: AddTaskDialogProps) {
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
    const newTask = {
        projectId: projectId,
        title,
        description,
    };
    onTaskAdd(newTask);
    toast({ title: 'Task Added', description: `"${title}" has been added to the project.` });
    
    const updatedTasks = aiResult?.suggestedTasks.filter(t => t.title !== title);
    if(updatedTasks && updatedTasks.length > 0) {
        setAiResult(prev => prev ? {...prev, suggestedTasks: updatedTasks} : null);
    } else {
        handleClose();
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setBrief('');
    setAiResult(null);
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Generate Tasks with AI
            </DialogTitle>
          <DialogDescription>
            Paste the project brief below to let AI analyze it and suggest actionable tasks for the team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="brief">Project Brief</Label>
            <Textarea
              id="brief"
              placeholder="Paste a detailed project brief here and let AI suggest tasks."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={8}
            />
          </div>
          <Button onClick={handleSummarize} disabled={isLoading || !brief}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Suggestions
          </Button>

          {aiResult && (
            <div className="mt-4 space-y-4 rounded-lg border bg-muted/50 p-4 max-h-[40vh] overflow-y-auto">
                <div className="space-y-1">
                    <h5 className="font-medium text-sm">Summary</h5>
                    <p className="text-sm text-muted-foreground">{aiResult.summary}</p>
                </div>
                <div className="space-y-2">
                    <h5 className="font-medium text-sm">Suggested Tasks ({aiResult.suggestedTasks.length})</h5>
                    {aiResult.suggestedTasks.map((task, index) => (
                        <div key={index} className="flex items-start justify-between gap-2 rounded-md border bg-background p-3">
                            <div className="space-y-1">
                                <p className="font-semibold text-sm">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleAddTask(task.title, task.description)} title={`Add "${task.title}"`}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
                Close
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
