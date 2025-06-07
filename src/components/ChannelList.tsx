
import React from 'react';
import { Hash, Lock, Users, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateChannelDialog from './CreateChannelDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  name: string;
  users: number;
  private: boolean;
  created_by?: string | null;
}

interface ChannelListProps {
  channels: Channel[];
  activeChannel: string;
  onChannelSelect: (channel: string) => void;
  onCreateChannel: (name: string, description?: string, isPrivate?: boolean) => Promise<{ error: any }>;
  onDeleteChannel: (channelId: string) => Promise<{ error: any }>;
}

const ChannelList = ({ channels, activeChannel, onChannelSelect, onCreateChannel, onDeleteChannel }: ChannelListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDeleteChannel = async (channelId: string, channelName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent channel selection
    
    if (!confirm(`Are you sure you want to delete the channel "${channelName}"?`)) {
      return;
    }

    const { error } = await onDeleteChannel(channelId);
    
    if (error) {
      toast({
        title: "Error deleting channel",
        description: error.message || "Failed to delete channel",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Channel deleted",
        description: `Channel "${channelName}" has been deleted successfully`,
      });
    }
  };

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-purple-300/20 text-white shadow-lg shadow-purple-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Hash className="w-5 h-5 text-purple-300" />
          <span>Channels</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {channels.map((channel) => (
          <div key={channel.id} className="relative group">
            <Button
              variant={activeChannel === channel.name ? "secondary" : "ghost"}
              className={`w-full justify-start text-left h-auto p-3 transition-all ${
                activeChannel === channel.name 
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50 shadow-md' 
                  : 'hover:bg-blue-500/20 text-gray-200 border border-transparent hover:border-blue-400/30'
              }`}
              onClick={() => onChannelSelect(channel.name)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  {channel.private ? (
                    <Lock className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Hash className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="font-medium">{channel.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300 bg-purple-500/10">
                    <Users className="w-3 h-3 mr-1" />
                    {channel.users}
                  </Badge>
                  {user && channel.created_by === user.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 hover:bg-red-500/20 hover:text-red-300"
                      onClick={(e) => handleDeleteChannel(channel.id, channel.name, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Button>
          </div>
        ))}
        
        <CreateChannelDialog onCreateChannel={onCreateChannel} />
      </CardContent>
    </Card>
  );
};

export default ChannelList;
