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
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';
import { useFirebaseServices } from '@/firebase';
import { useAuth as useAppAuth } from '@/firebase/provider';
import { useAuth as useFirebaseAuth } from '@/lib/auth-client';
import { signOut } from 'firebase/auth';


export function UserNavClient() {
  const { user: appUser } = useAppAuth();
  const { user: firebaseUser } = useFirebaseAuth();
  const router = useRouter();
  const { auth: authService } = useFirebaseServices();
  
  const user = appUser || firebaseUser;
  
  if (!user) {
    return null;
  }
  
  const displayName = appUser?.name || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'User';
  const displayEmail = appUser?.email || firebaseUser?.email || 'No email';
  const displayAvatarId = appUser?.avatar || (user?.uid ? `avatar-${(user.uid.charCodeAt(0) % 3) + 2}` : 'avatar-2');
  const userAvatarPlaceholder = PlaceHolderImages.find(img => img.id === displayAvatarId);

  // Prioritize the photoURL from the user object, fallback to placeholder
  const photoUrl = (appUser as any)?.photoURL || userAvatarPlaceholder?.imageUrl;

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
            <AvatarImage src={photoUrl} alt={displayName} />
            <AvatarFallback>{displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
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
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
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
