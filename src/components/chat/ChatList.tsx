
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ChatListProps {
  currentUserId: string;
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
}

export const ChatList: React.FC<ChatListProps> = ({
  currentUserId,
  onSelectUser,
  selectedUserId
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, [currentUserId]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .neq('id', currentUserId)
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-amber-500/20">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <MessageCircle size={20} />
          Messages
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            {searchQuery ? 'No users found' : 'No users available'}
          </div>
        ) : (
          <div className="p-2">
            {filteredProfiles.map((profile) => (
              <Button
                key={profile.id}
                variant={selectedUserId === profile.id ? "secondary" : "ghost"}
                className="w-full justify-start p-3 h-auto mb-1"
                onClick={() => onSelectUser(profile.id)}
              >
                <Avatar className="w-10 h-10 mr-3">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback>
                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-medium">
                    {profile.name || 'Unknown User'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
