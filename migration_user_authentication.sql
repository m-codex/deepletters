-- Step 1: Add new columns to the 'letters' table
ALTER TABLE letters
ADD COLUMN sender_id UUID REFERENCES auth.users(id),
ADD COLUMN temp_id UUID,
ADD COLUMN subject TEXT;

-- Step 2: Create the 'folders' table
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create the 'folder_letters' linking table
CREATE TABLE folder_letters (
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
    PRIMARY KEY (folder_id, letter_id)
);

-- Step 4: Create the 'user_letter_subjects' table
CREATE TABLE user_letter_subjects (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    PRIMARY KEY (user_id, letter_id)
);

-- Step 5: Create the 'saved_letters' table
CREATE TABLE saved_letters (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, letter_id)
);

-- Step 6: Update RLS policies for the new tables
-- Folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own folders"
ON folders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Folder Letters
ALTER TABLE folder_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage letter associations for their own folders"
ON folder_letters
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM folders
    WHERE folders.id = folder_letters.folder_id
    AND folders.user_id = auth.uid()
  )
);

-- User Letter Subjects
ALTER TABLE user_letter_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own letter subjects"
ON user_letter_subjects
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Saved Letters
ALTER TABLE saved_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved letters"
ON saved_letters
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 7: Update RLS policies for the 'letters' table
-- Allow anonymous users to create letters
CREATE POLICY "Anonymous users can create letters"
ON letters
FOR INSERT
WITH CHECK (auth.role() = 'anon');

-- Allow registered users to link their anonymous letters
CREATE POLICY "Users can update their anonymous letters"
ON letters
FOR UPDATE
USING (
  auth.uid() = sender_id AND temp_id IS NOT NULL
)
WITH CHECK (
  auth.uid() = sender_id
);

-- Allow users to read letters they have sent or saved
CREATE POLICY "Users can read their own or saved letters"
ON letters
FOR SELECT
USING (
  auth.uid() = sender_id
  OR
  EXISTS (
    SELECT 1 FROM saved_letters
    WHERE saved_letters.letter_id = letters.id
    AND saved_letters.user_id = auth.uid()
  )
);