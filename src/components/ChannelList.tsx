
import React from 'react';
import { Hash, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Channel {
  id: number;
  name: string;
  users: number;
  private: boolean;
}

interface ChannelListProps {
  channels: Channel[];
  activeChannel: string;
  onChannelSelect: (channel: string) => void;
}

const ChannelList = ({ channels, activeChannel, onChannelSelect }: ChannelListProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Hash className="w-5 h-5" />
          <span>Channels</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {channels.map((channel) => (
          <Button
            key={channel.id}
            variant={activeChannel === channel.name ? "secondary" : "ghost"}
            className={`w-full justify-start text-left h-auto p-3 ${
              activeChannel === channel.name 
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' 
                : 'hover:bg-white/10 text-gray-300'
            }`}
            onClick={() => onChannelSelect(channel.name)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {channel.private ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
                <span className="font-medium">{channel.name}</span>
              </div>
              <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
                <Users className="w-3 h-3 mr-1" />
                {channel.users}
              </Badge>
            </div>
          </Button>
        ))}
        
        <Button variant="ghost" className="w-full justify-start text-gray-400 hover:bg-white/10">
          <span className="text-2xl mr-2">+</span>
          <span>Create Channel</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChannelList;
