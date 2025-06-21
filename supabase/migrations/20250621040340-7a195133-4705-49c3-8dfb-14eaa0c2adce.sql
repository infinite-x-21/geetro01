
-- Add foreign key constraints to friend_requests table to properly link with profiles
ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);
