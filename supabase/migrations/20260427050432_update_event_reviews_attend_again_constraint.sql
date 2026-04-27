alter table public.event_reviews
  drop constraint if exists event_reviews_attend_again_check;

update public.event_reviews
set attend_again = case
  when attend_again in ('yes', 'no', 'maybe') then attend_again
  when attend_again = 'charged_up' then 'yes'
  when attend_again = 'sparked' then 'maybe'
  when attend_again = 'drained' then 'no'
  else 'maybe'
end
where attend_again is not null
  and attend_again not in ('yes', 'no', 'maybe');

alter table public.event_reviews
  add constraint event_reviews_attend_again_check
  check (
    attend_again is null
    or attend_again in ('yes', 'no', 'maybe')
  );

notify pgrst, 'reload schema';
