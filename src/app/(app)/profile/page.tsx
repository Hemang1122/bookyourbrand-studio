'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/firebase/provider';
import { useFirebaseServices } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } 
  from 'firebase/storage';
import { updatePassword, reauthenticateWithCredential,
         EmailAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } 
  from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } 
  from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { firestore, auth, firebaseApp } = useFirebaseServices();
  const { toast } = useToast();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = 
    useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = 
    useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateName = async () => {
    if (!firestore || !currentUser || !name.trim()) return;
    setIsSavingName(true);
    try {
      await updateDoc(
        doc(firestore, 'users', currentUser.id), 
        { name: name.trim() }
      );
      if (currentUser.role === 'client') {
        await updateDoc(
          doc(firestore, 'clients', currentUser.id),
          { name: name.trim() }
        );
      }
      toast({ title: 'Name updated successfully!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, 
              variant: 'destructive' });
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !firebaseApp) return;
    
    setIsUploadingPhoto(true);
    try {
      const storage = getStorage(firebaseApp);
      const photoRef = ref(
        storage,
        `profile-photos/${currentUser.id}/${Date.now()}_${file.name}`
      );
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);
      
      await updateDoc(
        doc(firestore!, 'users', currentUser.id),
        { photoURL }
      );
       if (currentUser.role === 'client') {
        await updateDoc(
          doc(firestore!, 'clients', currentUser.id),
          { avatar: photoURL } // Assuming client avatar field is 'avatar'
        );
      }

      toast({ title: 'Profile photo updated!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message,
              variant: 'destructive' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth?.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', 
              variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters',
              variant: 'destructive' });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(
        auth.currentUser, credential
      );
      
      // Then update password
      await updatePassword(auth.currentUser, newPassword);
      
      toast({ title: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential') {
        toast({ title: 'Current password is incorrect',
                variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: err.message,
                variant: 'destructive' });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!currentUser) return null;
  
  const displayAvatar = (currentUser as any).photoURL || PlaceHolderImages.find(p => p.id === currentUser.avatar)?.imageUrl;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={displayAvatar} 
                alt={currentUser.name} 
              />
              <AvatarFallback className="text-2xl">
                {currentUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 
                         bg-primary text-primary-foreground 
                         rounded-full p-1.5 hover:bg-primary/90"
            >
              {isUploadingPhoto 
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Camera className="h-3 w-3" />
              }
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div>
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">
              {currentUser.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize 
                          mt-1 bg-muted px-2 py-0.5 rounded-full 
                          inline-block">
              {currentUser.role}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Update Name */}
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
           <CardDescription>Update your public display name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <Button 
            onClick={handleUpdateName} 
            disabled={isSavingName || name === currentUser.name}
          >
            {isSavingName && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Name
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
           <CardDescription>It is recommended to use a strong password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword 
                      || !newPassword || !confirmPassword}
          >
            {isChangingPassword && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
