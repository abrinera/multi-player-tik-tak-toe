
REVOKE SELECT ON public.player_sessions FROM anon, authenticated;
GRANT SELECT (id, room_id, display_name, player_position, symbol, connection_status, session_wins, joined_at, last_seen_at) ON public.player_sessions TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public._check_win(text[], integer, integer, integer) FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public._check_win(board text[], size integer, win_len integer, last_pos integer)
 RETURNS integer[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare
  row_i int := last_pos / size;
  col_i int := last_pos % size;
  sym text := board[last_pos+1];
  dirs int[][] := array[array[0,1],array[1,0],array[1,1],array[1,-1]];
  d int; dr int; dc int;
  cells int[]; r int; c int; idx int;
begin
  if sym is null or sym = '' then return null; end if;
  for d in 1..4 loop
    dr := dirs[d][1]; dc := dirs[d][2];
    cells := array[last_pos];
    r := row_i + dr; c := col_i + dc;
    while r>=0 and r<size and c>=0 and c<size loop
      idx := r*size + c;
      if board[idx+1] = sym then
        cells := cells || idx; r := r + dr; c := c + dc;
      else exit; end if;
    end loop;
    r := row_i - dr; c := col_i - dc;
    while r>=0 and r<size and c>=0 and c<size loop
      idx := r*size + c;
      if board[idx+1] = sym then
        cells := cells || idx; r := r - dr; c := c - dc;
      else exit; end if;
    end loop;
    if coalesce(array_length(cells,1),0) >= win_len then
      return (select array_agg(x order by x) from unnest(cells) x);
    end if;
  end loop;
  return null;
end $function$;
