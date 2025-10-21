CREATE OR REPLACE FUNCTION claim_letter(share_code_to_claim TEXT)
RETURNS VOID AS $$
DECLARE
  claimed_letter_id UUID;
BEGIN
  UPDATE public.letters
  SET sender_id = auth.uid()
  WHERE share_code = share_code_to_claim AND sender_id IS NULL
  RETURNING id INTO claimed_letter_id;

  IF claimed_letter_id IS NOT NULL THEN
    INSERT INTO public.saved_letters (user_id, letter_id)
    VALUES (auth.uid(), claimed_letter_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
