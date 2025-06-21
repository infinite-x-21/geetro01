
-- Create friend_requests table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create friendships table (for accepted friend requests)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering to avoid duplicates
);

-- Enable RLS on friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received
CREATE POLICY "Users can view their friend requests" 
  ON public.friend_requests 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests" 
  ON public.friend_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Users can update requests they received (to accept/reject)
CREATE POLICY "Users can update received requests" 
  ON public.friend_requests 
  FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're part of
CREATE POLICY "Users can view their friendships" 
  ON public.friendships 
  FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can create friendships (this will be done via trigger)
CREATE POLICY "Users can create friendships" 
  ON public.friendships 
  FOR INSERT 
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Function to create friendship when friend request is accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If request was accepted, create friendship
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.friendships (user1_id, user2_id)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create friendship when request is accepted
CREATE TRIGGER friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friend_request_update();

-- Function to get user's friends
CREATE OR REPLACE FUNCTION public.get_user_friends(user_id UUID)
RETURNS TABLE(
  friend_id UUID,
  friend_name TEXT,
  friend_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user1_id = user_id THEN f.user2_id
      ELSE f.user1_id
    END as friend_id,
    p.name as friend_name,
    p.avatar_url as friend_avatar_url
  FROM public.friendships f
  JOIN public.profiles p ON (
    CASE 
      WHEN f.user1_id = user_id THEN f.user2_id
      ELSE f.user1_id
    END = p.id
  )
  WHERE f.user1_id = user_id OR f.user2_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update direct_messages table to only allow messages between friends
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.direct_messages;
CREATE POLICY "Users can view messages between friends" 
  ON public.direct_messages 
  FOR SELECT 
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id AND
    EXISTS (
      SELECT 1 FROM public.friendships 
      WHERE (user1_id = sender_id AND user2_id = recipient_id) 
         OR (user1_id = recipient_id AND user2_id = sender_id)
         OR (user1_id = LEAST(sender_id, recipient_id) AND user2_id = GREATEST(sender_id, recipient_id))
    )
  );

DROP POLICY IF EXISTS "Users can send their own messages" ON public.direct_messages;
CREATE POLICY "Users can send messages to friends" 
  ON public.direct_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.friendships 
      WHERE (user1_id = sender_id AND user2_id = recipient_id) 
         OR (user1_id = recipient_id AND user2_id = sender_id)
         OR (user1_id = LEAST(sender_id, recipient_id) AND user2_id = GREATEST(sender_id, recipient_id))
    )
  );
