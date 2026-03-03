'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices } from '@/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { migrateAllClients } from '@/lib/migration-utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function MigrationPage() {
  const { user } = useAuth();
  const { firestore } = useFirebaseServices();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' });
  const [results, setResults] = useState<{
    total: number;
    succeeded: number;
    failed: number;
    details: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleMigrate = async () => {
    if (!firestore || !user) return;

    const confirm = window.confirm(
      'Are you sure you want to migrate all clients from the old billing system to the new package system? This action will update all client and user records.'
    );

    if (!confirm) return;

    setIsMigrating(true);
    setResults(null);

    try {
      const migrationResults = await migrateAllClients(
        firestore,
        user.id,
        (current, total, name) => {
          setProgress({ current, total, name });
        }
      );

      setResults(migrationResults);
      toast({
        title: 'Migration Complete',
        description: `${migrationResults.succeeded} clients migrated successfully!`
      });
    } catch (error: any) {
      toast({
        title: 'Migration Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-muted-foreground">Access denied. Only admins can view this tool.</div>;
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/packages"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Billing System Migration</h1>
          <p className="text-muted-foreground">
            Synchronize client records with the new high-performance package system
          </p>
        </div>
      </div>

      <Card className="p-6 mb-8 bg-orange-500/10 border-orange-500/20">
        <div className="flex gap-4">
          <AlertCircle className="h-6 w-6 text-orange-400 shrink-0" />
          <div className="space-y-3">
            <h3 className="font-semibold text-orange-400">Migration Safety & Details</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">•</span>
                <span>Converts legacy <strong>Starter/Growth/Pro</strong> plans to the new tiers based on historical pricing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">•</span>
                <span>Scans existing projects to calculate the current usage (reels used) automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">•</span>
                <span>Safely ignores clients who have already been upgraded.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">•</span>
                <span>Preserves original billing data in an <code>oldBillingSystem</code> field for auditing.</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {!isMigrating && !results && (
        <Card className="p-8 bg-[#13131F] border-white/5 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ready to Start?</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The migration will process all clients in the system. This process is non-destructive and can be monitored in real-time.
          </p>
          <Button onClick={handleMigrate} className="w-full sm:w-64 bg-gradient-to-r from-purple-600 to-pink-500 border-0" size="lg">
            Start Migration Tool
          </Button>
        </Card>
      )}

      {isMigrating && (
        <Card className="p-8 bg-[#13131F] border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <h3 className="text-lg font-semibold text-white">Migration in Progress...</h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Processing: <span className="text-white font-medium">{progress.name}</span></span>
                <span className="text-primary font-bold">{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} className="h-3" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please do not refresh or close this browser tab until the process completes.
            </p>
          </div>
        </Card>
      )}

      {results && (
        <Card className="p-8 bg-[#13131F] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Migration Complete</h3>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Finished</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <p className="text-3xl font-bold text-white mb-1">{results.total}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Clients</p>
            </div>
            <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
              <p className="text-3xl font-bold text-green-400 mb-1">{results.succeeded}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Successful</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
              <p className="text-3xl font-bold text-red-400 mb-1">{results.failed}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Failed</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-400 px-1">Log Details</h4>
            <ScrollArea className="h-[300px] rounded-xl bg-black/40 border border-white/5 p-4">
              <div className="space-y-2 font-mono text-xs">
                {results.details.map((detail, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-3 p-2 rounded-lg border",
                    detail.startsWith('✅') ? "bg-green-500/5 border-green-500/10 text-green-300/80" : "bg-red-500/5 border-red-500/10 text-red-300/80"
                  )}>
                    <span className="shrink-0">{detail.startsWith('✅') ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}</span>
                    <span>{detail.slice(2)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-8 flex gap-4">
            <Button onClick={() => window.location.reload()} variant="outline" className="flex-1 border-white/10 hover:bg-white/5">
              Reload Dashboard
            </Button>
            <Button asChild className="flex-1 bg-primary">
              <Link href="/admin/packages">View All Packages</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
