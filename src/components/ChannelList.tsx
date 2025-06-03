
import React from 'react';
import { Hash, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Channel {
  id: string;
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
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Hash className="w-5 h-5 text-red-300" />
          <span>Channels</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {channels.map((channel) => (
          <Button
            key={channel.id}
            variant={activeChannel === channel.name ? "secondary" : "ghost"}
            className={`w-full justify-start text-left h-auto p-3 transition-all ${
              activeChannel === channel.name 
                ? 'bg-red-500/30 text-red-200 border border-red-400/50 shadow-md' 
                : 'hover:bg-blue-500/20 text-gray-200 border border-transparent hover:border-blue-400/30'
            }`}
            onClick={() => onChannelSelect(channel.name)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {channel.private ? (
                  <Lock className="w-4 h-4 text-orange-400" />
                ) : (
                  <Hash className="w-4 h-4 text-red-400" />
                )}
                <span className="font-medium">{channel.name}</span>
              </div>
              <Badge variant="outline" className="text-xs border-red-500/50 text-red-300 bg-red-500/10">
                <Users className="w-3 h-3 mr-1" />
                {channel.users}
              </Badge>
            </div>
          </Button>
        ))}
        
        <Button variant="ghost" className="w-full justify-start text-red-300 hover:bg-blue-500/20 hover:text-red-200 border border-transparent hover:border-blue-400/30">
          <span className="text-2xl mr-2 text-red-400">+</span>
          <span>Create Channel</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChannelList;
