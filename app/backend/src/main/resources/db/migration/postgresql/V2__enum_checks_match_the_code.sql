-- PostgreSQL only: H2 is always built from V1, which already has these checks.
-- Neon was built by ddl-auto=update, which wrote each enum check once and never widened it, so a value added
-- later (PENDING_APPROVAL, INACTIVE, PASSWORD_RESET, ...) was refused on the live database. Every check on an
-- enum column is dropped whatever its name, and written again with the values of V1.

do $$
declare
    stale record;
begin
    for stale in
        select c.relname as table_name, k.conname as constraint_name
        from pg_constraint k
        join pg_class c on c.oid = k.conrelid
        join pg_namespace n on n.oid = c.relnamespace
        join pg_attribute a on a.attrelid = c.oid and a.attnum = any (k.conkey)
        where k.contype = 'c' and n.nspname = current_schema() and (c.relname, a.attname) in (
            ('application_status_history', 'status'),
            ('applications', 'application_status'),
            ('job_postings', 'post_status'),
            ('notifications', 'status'),
            ('notifications', 'type'),
            ('offers', 'status'),
            ('organization_memberships', 'request_type'),
            ('organization_memberships', 'status'),
            ('organizations', 'organization_status'),
            ('users', 'account_status'))
    loop
        execute format('alter table %I drop constraint if exists %I', stale.table_name, stale.constraint_name);
    end loop;
end
$$;

alter table application_status_history add constraint application_status_history_status_check check (status in ('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN','OFFER_DECLINED'));
alter table applications add constraint applications_application_status_check check (application_status in ('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN','OFFER_DECLINED'));
alter table job_postings add constraint job_postings_post_status_check check (post_status in ('DRAFT','PENDING_APPROVAL','RETURNED','PUBLISHED','CLOSED','REJECTED','EXPIRED'));
alter table notifications add constraint notifications_status_check check (status in ('PENDING','SENT'));
alter table notifications add constraint notifications_type_check check (type in ('EMAIL_VERIFICATION','PASSWORD_RESET','NEW_RECRUITER_REQUEST','MEMBERSHIP_REQUEST','REQUEST_CONFIRMATION','REQUEST_APPROVED','REQUEST_DENIED','INFORMATION_REQUESTED'));
alter table offers add constraint offers_status_check check (status in ('PENDING','ACCEPTED','DECLINED','EXPIRED','RESCINDED'));
alter table organization_memberships add constraint organization_memberships_request_type_check check (request_type in ('NEW_RECRUITER_NEW_ORGANIZATION','NEW_RECRUITER_EXISTING_ORGANIZATION','ADDITIONAL_ORGANIZATION','ADDITIONAL_NEW_ORGANIZATION'));
alter table organization_memberships add constraint organization_memberships_status_check check (status in ('AWAITING_VERIFICATION','PENDING','INFORMATION_REQUESTED','ACTIVE','DENIED','CANCELLED'));
alter table organizations add constraint organizations_organization_status_check check (organization_status in ('PENDING_APPROVAL','ACTIVE','INACTIVE'));
alter table users add constraint users_account_status_check check (account_status in ('PENDING_VERIFICATION','PENDING_APPROVAL','ACTIVE','INACTIVE'));
