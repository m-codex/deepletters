CREATE OR REPLACE FUNCTION claim_letter(share_code_to_claim TEXT)
RETURNS SETOF letters AS $$
BEGIN
  RETURN QUERY
  UPDATE public.letters
  SET sender_id = auth.uid()
  WHERE share_code = share_code_to_claim AND sender_id IS NULL
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
