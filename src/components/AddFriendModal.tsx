
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Search, X } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/integrations/supabase/client';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal = ({ isOpen, onClose }: AddFriendModalProps) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { sendFriendRequest } = useFriends();

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchEmail}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error in searchUsers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setIsSending(true);
    try {
      const { error } = await sendFriendRequest(userId);
      if (!error) {
        console.log('Friend request sent successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-red-300/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-200 flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Add Friend</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-3">
            <Label htmlFor="searchEmail" className="text-red-200">Search by username</Label>
            <div className="flex space-x-2">
              <Input
                id="searchEmail"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="bg-slate-800/50 border-red-300/20 text-white flex-1"
                placeholder="Enter username to search..."
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button
                onClick={searchUsers}
                disabled={isSearching || !searchEmail.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <Label className="text-red-200">Search Results:</Label>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.full_name || 'No name set'}
                      </p>
                      <p className="text-blue-300 text-sm">
                        @{user.username || 'No username'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={isSending}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    {isSending ? 'Sending...' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchResults.length === 0 && searchEmail && !isSearching && (
            <div className="text-center text-gray-400 py-4">
              No users found with that username.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
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

export default AddFriendModal;
