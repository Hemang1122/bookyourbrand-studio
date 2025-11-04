
'use client';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";

export function SettingsForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return null;
  }
  
  const [firstName, lastName] = user.name.split(' ');

  const handleSave = () => {
    // In a real application, this would call a function to update the user profile.
    // For now, we'll just show a confirmation.
    toast({
        title: "Profile Saved",
        description: "Your information has been updated.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal information. This feature is currently in development.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">First name</Label>
            <Input id="first-name" defaultValue={firstName || ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input id="last-name" defaultValue={lastName || ''} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue={user.email} readOnly />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave}>Save</Button>
      </CardFooter>
    </Card>
  )
}
