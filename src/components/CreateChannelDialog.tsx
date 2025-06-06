
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Hash, Plus } from 'lucide-react';

interface CreateChannelDialogProps {
  onCreateChannel: (name: string, description?: string, isPrivate?: boolean) => Promise<{ error: any }>;
}

const CreateChannelDialog = ({ onCreateChannel }: CreateChannelDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Channel name required",
        description: "Please enter a channel name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await onCreateChannel(name.trim(), description.trim() || undefined, isPrivate);
      
      if (error) {
        console.error('Error creating channel:', error);
        toast({
          title: "Error creating channel",
          description: error.message || "Failed to create channel",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Channel created!",
          description: `Successfully created channel "${name}"`,
        });
        setOpen(false);
        setName('');
        setDescription('');
        setIsPrivate(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-red-300 hover:bg-blue-500/20 hover:text-red-200 border border-transparent hover:border-blue-400/30">
          <Plus className="w-4 h-4 mr-2 text-red-400" />
          <span>Create Channel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900/95 backdrop-blur-lg border-red-300/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-200">
            <Hash className="w-5 h-5 text-red-400" />
            <span>Create New Channel</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-red-200">Channel Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
              className="bg-slate-800/50 border-red-300/20 text-white placeholder-red-300/50"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-red-200">Description (Optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter channel description"
              className="bg-slate-800/50 border-red-300/20 text-white placeholder-red-300/50"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-red-200">Private Channel</label>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 border border-red-300/20 text-red-300 hover:bg-red-500/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelDialog;
