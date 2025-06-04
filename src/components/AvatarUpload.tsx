
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUpload: (file: File) => Promise<{ data?: string; error?: any }>;
  fallbackText: string;
  className?: string;
}

const AvatarUpload = ({ currentAvatarUrl, onUpload, fallbackText, className }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    const { error } = await onUpload(file);
    
    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated successfully",
      });
    }
    
    setUploading(false);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className="relative">
        <Avatar className="w-20 h-20">
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="bg-gradient-to-r from-red-400 to-red-500 text-white text-lg">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        <Button
          size="sm"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 p-0"
          disabled={uploading}
        >
          <label htmlFor="avatar-upload" className="cursor-pointer w-full h-full flex items-center justify-center">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </label>
        </Button>
      </div>
      
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <p className="text-xs text-red-300 text-center">
        Click the camera icon to upload a new avatar
      </p>
    </div>
  );
};

export default AvatarUpload;
