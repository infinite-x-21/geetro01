import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Clock, Headphones } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  expires_at: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUserId,
  otherUserId
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOtherUserProfile();
    loadMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId}))`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOtherUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (error) throw error;
      setOtherUserProfile(data);
    } catch (error: any) {
      toast({
        title: 'Error loading user profile',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = (await supabase
        .from('direct_messages' as any)
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })) as any;

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      toast({
        title: 'Error loading messages',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

      const { data, error } = (await supabase
        .from('direct_messages' as any)
        .insert({
          content: newMessage.trim(),
          sender_id: currentUserId,
          recipient_id: otherUserId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()) as any;

      if (error) throw error;
      setNewMessage('');
      if (data) {
        setMessages(prev => [...prev, data]);
      }
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const startListeningSession = async () => {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours from now

      const { data: session, error } = (await supabase
        .from('listening_sessions' as any)
        .insert({
          host_id: currentUserId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()) as any;

      if (error) throw error;

      // Add both users as participants
      const { error: participantError } = (await supabase
        .from('session_participants' as any)
        .insert([
          { session_id: session.id, user_id: currentUserId },
          { session_id: session.id, user_id: otherUserId }
        ])) as any;

      if (participantError) throw participantError;

      toast({
        title: 'Listening session started',
        description: 'Both users can now listen to music together!',
      });
    } catch (error: any) {
      toast({
        title: 'Error starting listening session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUserProfile?.avatar_url || ''} />
            <AvatarFallback>
              {otherUserProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-white">
              {otherUserProfile?.name || 'Unknown User'}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} />
              Messages expire in 24 hours
            </p>
          </div>
        </div>
        <Button
          onClick={startListeningSession}
          size="sm"
          className="flex items-center gap-2"
        >
          <Headphones size={16} />
          Listen Together
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-amber-500/20">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
