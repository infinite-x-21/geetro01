
-- Enable RLS policies for direct_messages
CREATE POLICY "Users can view messages they sent or received" 
  ON public.direct_messages 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send their own messages" 
  ON public.direct_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Enable RLS policies for listening_sessions
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

-- Enable RLS policies for session_participants
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

-- Enable realtime for session_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER TABLE public.session_participants REPLICA IDENTITY FULL;