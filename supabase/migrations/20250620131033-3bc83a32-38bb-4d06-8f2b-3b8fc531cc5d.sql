
-- Create direct_messages table for one-to-one chat with auto-expiry
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create listening_sessions table for synchronized listening
CREATE TABLE public.listening_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create session_participants table to track who's in each listening session
CREATE TABLE public.session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.listening_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_direct_messages_sender_recipient ON public.direct_messages(sender_id, recipient_id);
CREATE INDEX idx_direct_messages_expires_at ON public.direct_messages(expires_at);
CREATE INDEX idx_listening_sessions_host ON public.listening_sessions(host_id);
CREATE INDEX idx_session_participants_session ON public.session_participants(session_id);

-- Enable RLS on direct_messages table
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for direct_messages
CREATE POLICY "Users can view messages they sent or received" 
  ON public.direct_messages 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send their own messages" 
  ON public.direct_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Enable RLS on listening_sessions table
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for listening_sessions
CREATE POLICY "Users can view sessions they host or participate in" 
  ON public.listening_sessions 
  FOR SELECT 
  USING (
    auth.uid() = host_id OR 
    EXISTS (
      SELECT 1 FROM public.session_participants 
      WHERE session_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own sessions" 
  ON public.listening_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- Enable RLS on session_participants table
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for session_participants
CREATE POLICY "Users can view participants in sessions they're part of" 
  ON public.session_participants 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.listening_sessions 
      WHERE id = session_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions" 
  ON public.session_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Function to clean up expired messages
CREATE OR REPLACE FUNCTION public.cleanup_expired_messages()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.direct_messages 
  WHERE expires_at < now();
$$;

-- Enable realtime for direct_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
