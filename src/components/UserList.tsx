
import React from 'react';
import { Mic, MicOff, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface User {
  id: number;
  name: string;
  status: 'online' | 'away' | 'busy';
  speaking: boolean;
  country: string;
}

interface UserListProps {
  users: User[];
}

const UserList = ({ users }: UserListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'busy': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸',
      'ES': '🇪🇸',
      'JP': '🇯🇵',
      'UK': '🇬🇧',
    };
    return flags[country] || '🌍';
  };

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-red-300" />
          <span>Online Users</span>
          <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-500/30">
            {users.filter(u => u.status === 'online').length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center space-x-3 p-2 rounded-lg transition-all border ${
              user.speaking 
                ? 'bg-green-500/20 border-green-400/40 shadow-md shadow-green-500/20' 
                : 'hover:bg-blue-500/10 border-transparent hover:border-blue-400/20'
            }`}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0)}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${getStatusColor(user.status)}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <span className="text-sm">{getCountryFlag(user.country)}</span>
              </div>
              <p className="text-xs text-red-300 capitalize">{user.status}</p>
            </div>
            
            <div className="flex-shrink-0">
              {user.speaking ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <Mic className="w-4 h-4" />
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-green-400 rounded animate-pulse" />
                    <div className="w-1 h-4 bg-green-400 rounded animate-pulse animation-delay-100" />
                    <div className="w-1 h-2 bg-green-400 rounded animate-pulse animation-delay-200" />
                  </div>
                </div>
              ) : (
                <MicOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UserList;
