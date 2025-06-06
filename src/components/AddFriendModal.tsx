
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Search, X } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal = ({ isOpen, onClose }: AddFriendModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const { sendFriendRequest } = useFriends();
  const { toast } = useToast();

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Please enter a search term",
        description: "Enter a username or name to search for users",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for users with term:', searchTerm);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search failed",
          description: "Failed to search for users",
          variant: "destructive"
        });
        return;
      }

      console.log('Search results:', data);
      setSearchResults(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No users found",
          description: "No users found matching your search term",
        });
      }
    } catch (error) {
      console.error('Error in searchUsers:', error);
      toast({
        title: "Search error",
        description: "An error occurred while searching",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (sendingRequests.has(userId)) return;
    
    setSendingRequests(prev => new Set(prev).add(userId));
    
    try {
      console.log('Sending friend request to user:', userId);
      
      const { error } = await sendFriendRequest(userId);
      
      if (!error) {
        console.log('Friend request sent successfully');
        toast({
          title: "Success!",
          description: "Friend request sent successfully",
        });
        onClose();
        setSearchTerm('');
        setSearchResults([]);
      } else {
        console.error('Failed to send friend request:', error);
        toast({
          title: "Failed to send request",
          description: error.message || "Failed to send friend request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending the request",
        variant: "destructive"
      });
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            <Label htmlFor="searchTerm" className="text-red-200">Search by username or name</Label>
            <div className="flex space-x-2">
              <Input
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800/50 border-red-300/20 text-white flex-1"
                placeholder="Enter username or name..."
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button
                onClick={searchUsers}
                disabled={isSearching || !searchTerm.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
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
                    disabled={sendingRequests.has(user.id)}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {sendingRequests.has(user.id) ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <UserPlus className="w-3 h-3 mr-1" />
                    )}
                    {sendingRequests.has(user.id) ? 'Sending...' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
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
