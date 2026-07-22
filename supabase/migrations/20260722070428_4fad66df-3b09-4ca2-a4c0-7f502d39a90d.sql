
create extension if not exists pgcrypto;

create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique,
  status text not null default 'waiting' check (status in ('waiting','active','completed','cancelled','expired')),
  board_size int not null check (board_size in (3,5,7)),
  winning_length int not null check (winning_length in (3,4,5)),
  current_round_id uuid,
  rematch_requested_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table public.player_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  private_session_token_hash text not null,
  display_name text not null,
  player_position int not null check (player_position in (1,2)),
  symbol text check (symbol in ('X','O')),
  connection_status text not null default 'connected' check (connection_status in ('connected','reconnecting','disconnected','left')),
  session_wins int not null default 0,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(room_id, player_position),
  unique(room_id, private_session_token_hash)
);

create table public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  round_number int not null,
  board_state text[] not null,
  current_turn_player_id uuid references public.player_sessions(id),
  turn_number int not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress','completed','draw')),
  winner_player_id uuid references public.player_sessions(id),
  winning_cells int[],
  starting_x_player_id uuid,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(room_id, round_number)
);

create table public.game_moves (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  player_id uuid not null references public.player_sessions(id),
  cell_index int not null,
  symbol text not null check (symbol in ('X','O')),
  turn_number int not null,
  client_action_id text not null,
  created_at timestamptz not null default now(),
  unique(round_id, client_action_id),
  unique(round_id, cell_index)
);

create index on public.game_rooms(public_token);
create index on public.player_sessions(room_id);
create index on public.game_rounds(room_id);
create index on public.game_moves(round_id);

grant select on public.game_rooms to anon, authenticated;
grant select on public.player_sessions to anon, authenticated;
grant select on public.game_rounds to anon, authenticated;
grant select on public.game_moves to anon, authenticated;
grant all on public.game_rooms to service_role;
grant all on public.player_sessions to service_role;
grant all on public.game_rounds to service_role;
grant all on public.game_moves to service_role;

alter table public.game_rooms enable row level security;
alter table public.player_sessions enable row level security;
alter table public.game_rounds enable row level security;
alter table public.game_moves enable row level security;

create policy "read rooms" on public.game_rooms for select using (true);
create policy "read sessions" on public.player_sessions for select using (true);
create policy "read rounds" on public.game_rounds for select using (true);
create policy "read moves" on public.game_moves for select using (true);

alter publication supabase_realtime add table public.game_rooms;
alter publication supabase_realtime add table public.player_sessions;
alter publication supabase_realtime add table public.game_rounds;
alter publication supabase_realtime add table public.game_moves;

create or replace function public._check_win(board text[], size int, win_len int, last_pos int)
returns int[] language plpgsql immutable as $fn$
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
end $fn$;

create or replace function public.create_game_room(p_display_name text, p_board_size int, p_session_token text)
returns json language plpgsql security definer set search_path = public as $fn$
declare v_room_id uuid; v_token text; v_session_id uuid; v_win_len int; v_name text;
begin
  v_name := btrim(p_display_name);
  v_name := regexp_replace(v_name, '[<>]', '', 'g');
  if length(v_name) < 1 or length(v_name) > 24 then raise exception 'invalid_name'; end if;
  if p_board_size = 3 then v_win_len := 3;
  elsif p_board_size = 5 then v_win_len := 4;
  elsif p_board_size = 7 then v_win_len := 5;
  else raise exception 'invalid_board_size'; end if;
  if p_session_token is null or length(p_session_token) < 32 then raise exception 'invalid_session_token'; end if;

  v_token := replace(replace(replace(encode(gen_random_bytes(18),'base64'),'+','-'),'/','_'),'=','');

  insert into public.game_rooms(public_token, board_size, winning_length, expires_at)
    values (v_token, p_board_size, v_win_len, now() + interval '30 minutes')
    returning id into v_room_id;

  insert into public.player_sessions(room_id, private_session_token_hash, display_name, player_position)
    values (v_room_id, encode(digest(p_session_token,'sha256'),'hex'), v_name, 1)
    returning id into v_session_id;

  return json_build_object('room_token', v_token, 'session_id', v_session_id, 'room_id', v_room_id);
end $fn$;

create or replace function public.join_game_room(p_room_token text, p_display_name text, p_session_token text)
returns json language plpgsql security definer set search_path = public as $fn$
declare v_room public.game_rooms; v_name text; v_hash text; v_existing uuid;
  v_p1 uuid; v_p2 uuid; v_x uuid; v_round_id uuid; v_board text[]; v_count int;
begin
  if p_session_token is null or length(p_session_token) < 32 then raise exception 'invalid_session_token'; end if;
  v_hash := encode(digest(p_session_token,'sha256'),'hex');

  select * into v_room from public.game_rooms where public_token = p_room_token for update;
  if not found then raise exception 'not_found'; end if;
  if v_room.expires_at < now() and v_room.status not in ('completed','active') then
    update public.game_rooms set status='expired' where id = v_room.id;
    raise exception 'expired';
  end if;
  if v_room.status = 'cancelled' then raise exception 'cancelled'; end if;
  if v_room.status = 'expired' then raise exception 'expired'; end if;

  select id into v_existing from public.player_sessions where room_id = v_room.id and private_session_token_hash = v_hash;
  if v_existing is not null then
    update public.player_sessions set connection_status='connected', last_seen_at=now() where id = v_existing;
    return json_build_object('session_id', v_existing, 'room_id', v_room.id, 'recovered', true);
  end if;

  if v_room.status <> 'waiting' then raise exception 'full'; end if;
  select count(*) into v_count from public.player_sessions where room_id = v_room.id;
  if v_count >= 2 then raise exception 'full'; end if;

  v_name := btrim(p_display_name);
  v_name := regexp_replace(v_name, '[<>]', '', 'g');
  if length(v_name) < 1 or length(v_name) > 24 then raise exception 'invalid_name'; end if;

  insert into public.player_sessions(room_id, private_session_token_hash, display_name, player_position)
    values (v_room.id, v_hash, v_name, 2)
    returning id into v_existing;

  select id into v_p1 from public.player_sessions where room_id = v_room.id and player_position = 1;
  v_p2 := v_existing;
  if random() < 0.5 then v_x := v_p1; else v_x := v_p2; end if;
  update public.player_sessions set symbol='X' where id = v_x;
  update public.player_sessions set symbol='O' where room_id = v_room.id and id <> v_x;

  v_board := array_fill(''::text, array[v_room.board_size * v_room.board_size]);
  insert into public.game_rounds(room_id, round_number, board_state, current_turn_player_id, starting_x_player_id)
    values (v_room.id, 1, v_board, v_x, v_x)
    returning id into v_round_id;

  update public.game_rooms set status='active', current_round_id=v_round_id, last_activity_at=now(), updated_at=now(), expires_at = now() + interval '24 hours' where id = v_room.id;

  return json_build_object('session_id', v_existing, 'room_id', v_room.id, 'recovered', false);
end $fn$;

create or replace function public.make_move(
  p_room_token text, p_session_token text, p_round_id uuid,
  p_cell_index int, p_expected_turn int, p_client_action_id text
) returns json language plpgsql security definer set search_path = public as $fn$
declare v_room public.game_rooms; v_hash text; v_player public.player_sessions;
  v_round public.game_rounds; v_board text[]; v_win int[]; v_next_player uuid;
begin
  if p_session_token is null or length(p_session_token) < 32 then raise exception 'invalid_session_token'; end if;
  v_hash := encode(digest(p_session_token,'sha256'),'hex');
  select * into v_room from public.game_rooms where public_token = p_room_token for update;
  if not found then raise exception 'not_found'; end if;
  if v_room.status <> 'active' then raise exception 'not_active'; end if;

  select * into v_player from public.player_sessions where room_id = v_room.id and private_session_token_hash = v_hash;
  if not found then raise exception 'not_a_player'; end if;

  select * into v_round from public.game_rounds where id = p_round_id for update;
  if not found or v_round.room_id <> v_room.id then raise exception 'invalid_round'; end if;
  if v_round.status <> 'in_progress' then raise exception 'round_over'; end if;
  if v_round.current_turn_player_id <> v_player.id then raise exception 'not_your_turn'; end if;
  if v_round.turn_number <> p_expected_turn then raise exception 'stale_turn'; end if;
  if p_cell_index < 0 or p_cell_index >= v_room.board_size * v_room.board_size then raise exception 'invalid_cell'; end if;

  if exists(select 1 from public.game_moves where round_id = p_round_id and client_action_id = p_client_action_id) then
    return json_build_object('ok', true, 'duplicate', true);
  end if;

  v_board := v_round.board_state;
  if v_board[p_cell_index + 1] is not null and v_board[p_cell_index + 1] <> '' then
    raise exception 'cell_taken';
  end if;
  v_board[p_cell_index + 1] := v_player.symbol;

  insert into public.game_moves(round_id, player_id, cell_index, symbol, turn_number, client_action_id)
    values (p_round_id, v_player.id, p_cell_index, v_player.symbol, v_round.turn_number, p_client_action_id);

  v_win := public._check_win(v_board, v_room.board_size, v_room.winning_length, p_cell_index);

  if v_win is not null then
    update public.game_rounds set board_state=v_board, status='completed', winner_player_id=v_player.id, winning_cells=v_win, completed_at=now(), turn_number = v_round.turn_number + 1, current_turn_player_id=null where id = p_round_id;
    update public.player_sessions set session_wins = session_wins + 1 where id = v_player.id;
    update public.game_rooms set status='completed', last_activity_at=now(), updated_at=now(), expires_at = now() + interval '60 minutes' where id = v_room.id;
  elsif array_position(v_board, '') is null then
    update public.game_rounds set board_state=v_board, status='draw', completed_at=now(), turn_number = v_round.turn_number + 1, current_turn_player_id=null where id = p_round_id;
    update public.game_rooms set status='completed', last_activity_at=now(), updated_at=now(), expires_at = now() + interval '60 minutes' where id = v_room.id;
  else
    select id into v_next_player from public.player_sessions where room_id = v_room.id and id <> v_player.id;
    update public.game_rounds set board_state=v_board, turn_number = v_round.turn_number + 1, current_turn_player_id = v_next_player where id = p_round_id;
    update public.game_rooms set last_activity_at=now(), updated_at=now() where id = v_room.id;
  end if;

  return json_build_object('ok', true);
end $fn$;

create or replace function public.request_rematch(p_room_token text, p_session_token text)
returns json language plpgsql security definer set search_path = public as $fn$
declare v_room public.game_rooms; v_hash text; v_player public.player_sessions;
  v_round public.game_rounds; v_new_round_id uuid; v_new_x uuid; v_board text[];
begin
  if p_session_token is null or length(p_session_token) < 32 then raise exception 'invalid_session_token'; end if;
  v_hash := encode(digest(p_session_token,'sha256'),'hex');
  select * into v_room from public.game_rooms where public_token = p_room_token for update;
  if not found then raise exception 'not_found'; end if;
  if v_room.status <> 'completed' then raise exception 'not_completable'; end if;
  select * into v_player from public.player_sessions where room_id = v_room.id and private_session_token_hash = v_hash;
  if not found then raise exception 'not_a_player'; end if;

  if v_room.rematch_requested_by is null then
    update public.game_rooms set rematch_requested_by = v_player.id, last_activity_at=now(), updated_at=now() where id = v_room.id;
    return json_build_object('accepted', false);
  elsif v_room.rematch_requested_by = v_player.id then
    return json_build_object('accepted', false, 'already', true);
  else
    select * into v_round from public.game_rounds where id = v_room.current_round_id;
    update public.player_sessions set symbol = case symbol when 'X' then 'O' else 'X' end where room_id = v_room.id;
    select id into v_new_x from public.player_sessions where room_id = v_room.id and symbol='X';
    v_board := array_fill(''::text, array[v_room.board_size * v_room.board_size]);
    insert into public.game_rounds(room_id, round_number, board_state, current_turn_player_id, starting_x_player_id)
      values (v_room.id, v_round.round_number + 1, v_board, v_new_x, v_new_x)
      returning id into v_new_round_id;
    update public.game_rooms set status='active', current_round_id=v_new_round_id, rematch_requested_by=null, last_activity_at=now(), updated_at=now(), expires_at = now() + interval '24 hours' where id = v_room.id;
    return json_build_object('accepted', true);
  end if;
end $fn$;

create or replace function public.leave_room(p_room_token text, p_session_token text, p_forfeit bool default false)
returns json language plpgsql security definer set search_path = public as $fn$
declare v_room public.game_rooms; v_hash text; v_player public.player_sessions; v_other public.player_sessions; v_round public.game_rounds;
begin
  if p_session_token is null or length(p_session_token) < 32 then raise exception 'invalid_session_token'; end if;
  v_hash := encode(digest(p_session_token,'sha256'),'hex');
  select * into v_room from public.game_rooms where public_token = p_room_token for update;
  if not found then raise exception 'not_found'; end if;
  select * into v_player from public.player_sessions where room_id = v_room.id and private_session_token_hash = v_hash;
  if not found then raise exception 'not_a_player'; end if;
  update public.player_sessions set connection_status='left', last_seen_at=now() where id = v_player.id;

  if v_room.status = 'waiting' then
    update public.game_rooms set status='cancelled', updated_at=now(), last_activity_at=now() where id = v_room.id;
  elsif v_room.status = 'active' and p_forfeit then
    select * into v_other from public.player_sessions where room_id = v_room.id and id <> v_player.id;
    select * into v_round from public.game_rounds where id = v_room.current_round_id for update;
    update public.game_rounds set status='completed', winner_player_id=v_other.id, completed_at=now(), current_turn_player_id=null where id = v_round.id;
    update public.player_sessions set session_wins=session_wins+1 where id = v_other.id;
    update public.game_rooms set status='completed', last_activity_at=now(), updated_at=now(), expires_at=now()+interval '60 minutes' where id = v_room.id;
  end if;
  return json_build_object('ok', true);
end $fn$;

create or replace function public.heartbeat(p_room_token text, p_session_token text)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_hash text; v_room public.game_rooms;
begin
  if p_session_token is null or length(p_session_token) < 32 then return; end if;
  v_hash := encode(digest(p_session_token,'sha256'),'hex');
  select * into v_room from public.game_rooms where public_token = p_room_token;
  if not found then return; end if;
  update public.player_sessions set last_seen_at=now(),
    connection_status = case when connection_status='left' then 'left' else 'connected' end
    where room_id = v_room.id and private_session_token_hash = v_hash;
end $fn$;

grant execute on function public.create_game_room(text,int,text) to anon, authenticated;
grant execute on function public.join_game_room(text,text,text) to anon, authenticated;
grant execute on function public.make_move(text,text,uuid,int,int,text) to anon, authenticated;
grant execute on function public.request_rematch(text,text) to anon, authenticated;
grant execute on function public.leave_room(text,text,bool) to anon, authenticated;
grant execute on function public.heartbeat(text,text) to anon, authenticated;
