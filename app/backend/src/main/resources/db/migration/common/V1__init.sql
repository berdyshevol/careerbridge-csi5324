-- The schema as Hibernate built it from the entities before migrations (SCRUM-251, ADR-0014).
-- A database that already had these tables (Neon main and dev) is baselined at this version and skips it.

create sequence applications_seq start with 1 increment by 50;

create sequence interviews_seq start with 1 increment by 50;

create sequence job_postings_seq start with 1 increment by 50;

create sequence notifications_seq start with 1 increment by 50;

create sequence offers_seq start with 1 increment by 50;

create sequence organization_memberships_seq start with 1 increment by 50;

create sequence organizations_seq start with 1 increment by 50;

create sequence resume_seq start with 1 increment by 50;

create sequence users_seq start with 1 increment by 50;

create table administrator (
    user_id bigint not null,
    primary key (user_id)
);

create table applicant (
    resume_id bigint unique,
    user_id bigint not null,
    skills varchar(2000),
    education varchar(4000),
    work_experience varchar(10000),
    headline varchar(255),
    location varchar(255),
    primary key (user_id)
);

create table application_status_history (
    entry_date date not null,
    status_history_order integer not null check ((status_history_order>=0)),
    application_id bigint not null,
    reason varchar(1000),
    status varchar(255) not null check ((status in ('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN','OFFER_DECLINED'))),
    primary key (status_history_order, application_id)
);

create table applications (
    date_applied date not null,
    applicant_id bigint not null,
    application_id bigint not null,
    job_post_id bigint not null,
    resume_file_size bigint not null,
    withdrawn_at timestamp(6) with time zone,
    resume_content bytea,
    application_status varchar(255) not null check ((application_status in ('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN','OFFER_DECLINED'))),
    rejection_reason varchar(255),
    resume_file_name varchar(255) not null,
    resume_file_type varchar(255) not null,
    primary key (application_id),
    unique (applicant_id, job_post_id)
);

create table interviews (
    round_number integer not null,
    application_id bigint not null,
    interview_id bigint not null,
    scheduled_time timestamp(6) not null,
    notes varchar(2000),
    format varchar(255) not null,
    location varchar(255) not null,
    outcome varchar(255),
    primary key (interview_id)
);

create table job_postings (
    application_deadline date,
    date_posted date,
    number_of_openings integer not null,
    approved_at timestamp(6),
    closed_at timestamp(6) with time zone,
    job_post_id bigint not null,
    organization_id bigint not null,
    recruiter_id bigint,
    closing_reason varchar(50),
    job_requirements varchar(2000),
    review_comment varchar(2000),
    description varchar(10000),
    approved_by varchar(255),
    employment_type varchar(255),
    location varchar(255),
    post_status varchar(255) not null check ((post_status in ('DRAFT','PENDING_APPROVAL','RETURNED','PUBLISHED','CLOSED','REJECTED','EXPIRED'))),
    salary_range varchar(255),
    title varchar(255) not null,
    primary key (job_post_id)
);

create table notifications (
    notification_id bigint not null,
    recipient_id bigint not null,
    sent_at timestamp(6) with time zone,
    message varchar(2000),
    status varchar(255) not null check ((status in ('PENDING','SENT'))),
    type varchar(255) not null check ((type in ('EMAIL_VERIFICATION','PASSWORD_RESET','NEW_RECRUITER_REQUEST','MEMBERSHIP_REQUEST','REQUEST_CONFIRMATION','REQUEST_APPROVED','REQUEST_DENIED','INFORMATION_REQUESTED'))),
    primary key (notification_id)
);

create table offers (
    date_extended date not null,
    expiration_date date not null,
    response_date date,
    revision integer not null,
    start_date date not null,
    application_id bigint not null unique,
    offer_id bigint not null,
    terms varchar(4000),
    offer_letter_file_name varchar(255),
    salary varchar(255) not null,
    status varchar(255) not null check ((status in ('PENDING','ACCEPTED','DECLINED','EXPIRED','RESCINDED'))),
    primary key (offer_id)
);

create table organization_memberships (
    approved_at timestamp(6) with time zone,
    decided_at timestamp(6) with time zone,
    membership_id bigint not null,
    organization_id bigint not null,
    recruiter_id bigint not null,
    requested_at timestamp(6) with time zone not null,
    decision_note varchar(2000),
    justification varchar(2000),
    decided_by varchar(255),
    request_type varchar(255) not null check ((request_type in ('NEW_RECRUITER_NEW_ORGANIZATION','NEW_RECRUITER_EXISTING_ORGANIZATION','ADDITIONAL_ORGANIZATION','ADDITIONAL_NEW_ORGANIZATION'))),
    review_flag varchar(255),
    role varchar(255),
    status varchar(255) not null check ((status in ('AWAITING_VERIFICATION','PENDING','INFORMATION_REQUESTED','ACTIVE','DENIED','CANCELLED'))),
    primary key (membership_id)
);

create table organizations (
    organization_id bigint not null,
    time_zone varchar(100),
    description varchar(255),
    headquarters varchar(255),
    industry varchar(255),
    name varchar(255) not null unique,
    organization_size varchar(255),
    organization_status varchar(255) check ((organization_status in ('PENDING_APPROVAL','ACTIVE','INACTIVE'))),
    website varchar(255),
    primary key (organization_id)
);

create table recruiter (
    email_verified boolean,
    user_id bigint not null,
    verification_expires_at timestamp(6) with time zone,
    job_title varchar(255),
    verification_token_hash varchar(255),
    primary key (user_id)
);

create table resume (
    file_size bigint not null,
    resume_id bigint not null,
    upload_date timestamp(6) not null,
    content bytea,
    file_name varchar(255) not null,
    file_type varchar(255) not null,
    primary key (resume_id)
);

create table users (
    failed_log_ins integer,
    first_failed_log_in_at timestamp(6) with time zone,
    locked_until timestamp(6) with time zone,
    password_reset_expires_at timestamp(6) with time zone,
    user_id bigint not null,
    account_status varchar(255) not null check ((account_status in ('PENDING_VERIFICATION','PENDING_APPROVAL','ACTIVE','INACTIVE'))),
    email varchar(255) not null unique,
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    password_hash varchar(255),
    password_reset_token_hash varchar(255),
    phone varchar(255),
    primary key (user_id)
);

alter table if exists administrator 
   add constraint FKbdejjchi6pj988cu0w34b7hau 
   foreign key (user_id) 
   references users;

alter table if exists applicant 
   add constraint FK1tlju75xsxn8ieobn3ll4vpms 
   foreign key (resume_id) 
   references resume;

alter table if exists applicant 
   add constraint FKo79qmdbc0gwpqvnpue7wloef6 
   foreign key (user_id) 
   references users;

alter table if exists application_status_history 
   add constraint FKfdvnrm195jdlti0syxo6qah6h 
   foreign key (application_id) 
   references applications;

alter table if exists applications 
   add constraint FKm2rx6x04siu2ki4m93fu1g9qb 
   foreign key (applicant_id) 
   references applicant;

alter table if exists applications 
   add constraint FKm27t7r7gc4aoh56xbmujnrxgk 
   foreign key (job_post_id) 
   references job_postings;

alter table if exists interviews 
   add constraint FKok2bail5ls3jjbjgl5c6nt620 
   foreign key (application_id) 
   references applications;

alter table if exists job_postings 
   add constraint FKewyd5r5tskc0r8iarifqhsqst 
   foreign key (organization_id) 
   references organizations;

alter table if exists job_postings 
   add constraint FKr3rfbj6gg0a7suuw0k32q2vwc 
   foreign key (recruiter_id) 
   references recruiter;

alter table if exists notifications 
   add constraint FKqqnsjxlwleyjbxlmm213jaj3f 
   foreign key (recipient_id) 
   references users;

alter table if exists offers 
   add constraint FKhj817lidvjyh8tdemki8j4ps1 
   foreign key (application_id) 
   references applications;

alter table if exists organization_memberships 
   add constraint FKedfr2sj5wsdjnrnwylkari8c2 
   foreign key (organization_id) 
   references organizations;

alter table if exists organization_memberships 
   add constraint FK4cpt0odhvxgur7dyeny9eoxo7 
   foreign key (recruiter_id) 
   references recruiter;

alter table if exists recruiter 
   add constraint FK9rnqhy06sgckkvbqukip27b81 
   foreign key (user_id) 
   references users;
