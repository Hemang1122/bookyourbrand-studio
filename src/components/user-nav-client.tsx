'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';
import { useFirebaseServices } from '@/firebase';
import { useAuth } from '@/lib/auth-client';
import { signOut } from 'firebase/auth';


export function UserNavClient() {
  const { user } = useAuth();
  const router = useRouter();
  const { auth: authService } = useFirebaseServices();
  
  if (!user) {
    return null;
  }
  
  // This is a workaround to get the full profile data until the main layout's context is available
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const displayEmail = user.email || 'No email';
  const displayAvatar = `avatar-${(user.uid.charCodeAt(0) % 3) + 2}`
  const userAvatar = PlaceHolderImages.find(img => img.id === displayAvatar);


  const handleLogout = async () => {
    try {
      if (authService) {
        await signOut(authService);
      }
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={displayName} data-ai-hint={userAvatar?.imageHint} />}
            <AvatarFallback>{displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
           {/* This role check will be re-enabled once the full user profile is available */}
           {/* {user.role !== 'team' && ( */}
            <DropdownMenuItem asChild>
               <Link href="/settings/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
          {/* )} */}
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
