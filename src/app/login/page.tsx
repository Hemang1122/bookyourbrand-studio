import { login } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoginLogo } from '@/components/login-logo';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <LoginLogo />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
          <CardDescription>
            Select a role to sign in and experience the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <Select name="role" defaultValue="admin">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="team">Team Member</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
