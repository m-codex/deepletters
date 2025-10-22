-- Allow users to manage their own drafts
CREATE POLICY "Users can manage their own drafts"
ON letters
FOR ALL
USING (auth.uid() = sender_id AND status = 'draft')
WITH CHECK (auth.uid() = sender_id AND status = 'draft');