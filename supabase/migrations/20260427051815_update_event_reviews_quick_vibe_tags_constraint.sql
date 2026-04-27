alter table public.event_reviews
  drop constraint if exists event_reviews_quick_vibe_tags_check;

alter table public.event_reviews
  drop constraint if exists "event_reviews_quick_vibe_-tags_check";

update public.event_reviews
set quick_vibe_tags = array(
  select distinct tag
  from unnest(quick_vibe_tags) as tag
  where tag in ('social', 'explorer', 'connector', 'chill', 'wildcard')
)
where quick_vibe_tags is not null
  and not quick_vibe_tags <@ array['social', 'explorer', 'connector', 'chill', 'wildcard'];

alter table public.event_reviews
  add constraint event_reviews_quick_vibe_tags_check
  check (
    quick_vibe_tags is null
    or quick_vibe_tags <@ array['social', 'explorer', 'connector', 'chill', 'wildcard']
  );

notify pgrst, 'reload schema';
