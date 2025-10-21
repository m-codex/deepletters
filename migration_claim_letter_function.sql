CREATE OR REPLACE FUNCTION claim_letter(share_code_to_claim TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.letters
  SET sender_id = auth.uid()
  WHERE share_code = share_code_to_claim AND sender_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
