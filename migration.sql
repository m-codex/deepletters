-- To remove the themes table from your Supabase database, run the following SQL command in the Supabase SQL editor:

DROP TABLE themes;

-- To remove the theme_id column from the letters table, run the following SQL command in the Supabase SQL editor:

ALTER TABLE letters
DROP COLUMN theme_id;
