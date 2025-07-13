
-- Create storage policies for story-videos bucket
CREATE POLICY "Allow authenticated users to upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'story-videos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to videos" ON storage.objects
FOR SELECT USING (bucket_id = 'story-videos');

CREATE POLICY "Allow users to update their own videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'story-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'story-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for video-wallpapers bucket
CREATE POLICY "Allow authenticated users to upload wallpapers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'video-wallpapers' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to wallpapers" ON storage.objects
FOR SELECT USING (bucket_id = 'video-wallpapers');

CREATE POLICY "Allow users to update their own wallpapers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'video-wallpapers' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own wallpapers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'video-wallpapers' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
