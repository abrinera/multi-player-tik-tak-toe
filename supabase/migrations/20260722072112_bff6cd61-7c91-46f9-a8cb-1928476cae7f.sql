CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- Ensure functions can find gen_random_bytes/digest by using fully-qualified names is not needed if extensions is on search_path;
-- but to be robust, alter each function's search_path to include extensions.
ALTER FUNCTION public.create_game_room(text, integer, text) SET search_path = public, extensions;
ALTER FUNCTION public.join_game_room(text, text, text) SET search_path = public, extensions;
ALTER FUNCTION public.heartbeat(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.make_move(text, text, uuid, integer, integer, text) SET search_path = public, extensions;
ALTER FUNCTION public.request_rematch(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.leave_room(text, text, boolean) SET search_path = public, extensions;