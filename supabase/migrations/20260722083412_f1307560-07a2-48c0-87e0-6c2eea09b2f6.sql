
-- Prevent enumeration of room access tokens via public SELECT
REVOKE SELECT (public_token) ON public.game_rooms FROM anon, authenticated, PUBLIC;

-- Provide a controlled lookup: caller must already know the token
CREATE OR REPLACE FUNCTION public.get_room_by_token(p_room_token text)
RETURNS public.game_rooms
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT * FROM public.game_rooms WHERE public_token = p_room_token LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_room_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_room_by_token(text) TO anon, authenticated;
