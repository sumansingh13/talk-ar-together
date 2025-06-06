
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AvatarUpload from './AvatarUpload';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user } = useAuth();
  const { userProfile, refetch } = useSupabaseData();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setUsername(userProfile.username || '');
      setCountry(userProfile.country || '');
    }
  }, [userProfile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        return { error };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile with avatar:', updateError);
        return { error: updateError };
      }

      await refetch();
      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return { error };
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          country: country,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update profile:', error);
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully",
      });
      
      await refetch();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating your profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-red-300/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-200">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Section */}
          <AvatarUpload
            currentAvatarUrl={userProfile?.avatar_url}
            onUpload={handleAvatarUpload}
            fallbackText={(userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            className="flex flex-col items-center"
          />

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-red-200">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-slate-800/50 border-red-300/20 text-white"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-red-200">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-800/50 border-red-300/20 text-white"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <Label htmlFor="country" className="text-red-200">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-slate-800/50 border-red-300/20 text-white"
                placeholder="Enter your country"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-red-300/20 text-red-200 hover:bg-red-500/20"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
