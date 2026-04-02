create schema if not exists "internal";


  create table "public"."accounts" (
    "id" uuid not null,
    "display_name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."accounts" enable row level security;


  create table "public"."learners" (
    "id" uuid not null default gen_random_uuid(),
    "account_id" uuid not null,
    "display_name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."learners" enable row level security;

CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE INDEX learners_account_id_idx ON public.learners USING btree (account_id);

CREATE UNIQUE INDEX learners_pkey ON public.learners USING btree (id);

CREATE UNIQUE INDEX learners_unique_name ON public.learners USING btree (account_id, display_name);

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."learners" add constraint "learners_pkey" PRIMARY KEY using index "learners_pkey";

alter table "public"."accounts" add constraint "accounts_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."accounts" validate constraint "accounts_id_fkey";

alter table "public"."learners" add constraint "learners_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."learners" validate constraint "learners_account_id_fkey";

alter table "public"."learners" add constraint "learners_unique_name" UNIQUE using index "learners_unique_name";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION internal.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_display_name text;
begin
  v_display_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');

  insert into public.accounts (id, display_name, created_at)
  values (
    new.id,
    coalesce(v_display_name, 'User'),
    new.created_at
  );

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION internal.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$function$
;

grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."learners" to "anon";

grant insert on table "public"."learners" to "anon";

grant references on table "public"."learners" to "anon";

grant select on table "public"."learners" to "anon";

grant trigger on table "public"."learners" to "anon";

grant truncate on table "public"."learners" to "anon";

grant update on table "public"."learners" to "anon";

grant delete on table "public"."learners" to "authenticated";

grant insert on table "public"."learners" to "authenticated";

grant references on table "public"."learners" to "authenticated";

grant select on table "public"."learners" to "authenticated";

grant trigger on table "public"."learners" to "authenticated";

grant truncate on table "public"."learners" to "authenticated";

grant update on table "public"."learners" to "authenticated";

grant delete on table "public"."learners" to "service_role";

grant insert on table "public"."learners" to "service_role";

grant references on table "public"."learners" to "service_role";

grant select on table "public"."learners" to "service_role";

grant trigger on table "public"."learners" to "service_role";

grant truncate on table "public"."learners" to "service_role";

grant update on table "public"."learners" to "service_role";


  create policy "accounts_select_own"
  on "public"."accounts"
  as permissive
  for select
  to authenticated
using ((id = auth.uid()));



  create policy "accounts_update_own"
  on "public"."accounts"
  as permissive
  for update
  to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "learners_insert_own"
  on "public"."learners"
  as permissive
  for insert
  to authenticated
with check ((account_id = auth.uid()));



  create policy "learners_select_own"
  on "public"."learners"
  as permissive
  for select
  to authenticated
using ((account_id = auth.uid()));



  create policy "learners_update_own"
  on "public"."learners"
  as permissive
  for update
  to authenticated
using ((account_id = auth.uid()))
with check ((account_id = auth.uid()));


CREATE TRIGGER on_accounts_update BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION internal.handle_updated_at();

CREATE TRIGGER on_learners_update BEFORE UPDATE ON public.learners FOR EACH ROW EXECUTE FUNCTION internal.handle_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION internal.handle_new_user();


