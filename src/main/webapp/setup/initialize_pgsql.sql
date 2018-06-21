
drop sequence if exists SEQ_TASK_ID;
create sequence SEQ_TASK_ID start with 1 increment by 1;

drop table if exists SEQUENCES;
create table SEQUENCES (
  SEQ_ID varchar(32) not null,
  SEQ_VAL bigint not null,
  primary key (SEQ_ID)
);

drop table if exists TASKS;
create table TASKS (
  TASK_ID bigint not null,
  PROJECT_ID varchar(32) not null,
  DEL_FLG char(1) not null,
  TERM varchar(32) not null,
  USER_ID varchar(32) not null,
  MIN_ACT varchar(8) not null,
  MAX_ACT varchar(8) not null,
  JSON_DATA varchar(100000) not null,
  primary key (TASK_ID)
);

drop table if exists USERS;
create table USERS (
  USER_ID varchar(32) not null,
  JSON_DATA varchar(100000) not null,
  primary key (USER_ID)
);

drop table if exists PROJECTS;
create table PROJECTS (
  PROJECT_ID varchar(32) not null,
  JSON_DATA varchar(100000) not null,
  primary key (PROJECT_ID)
);

drop index if exists TASKS_IDX1;
create index TASKS_IDX1 on TASKS (PROJECT_ID,DEL_FLG); 
drop index if exists TASKS_IDX2;
create index TASKS_IDX2 on TASKS (TERM); 
drop index if exists TASKS_IDX3;
create index TASKS_IDX3 on TASKS (USER_ID); 
drop index if exists TASKS_IDX4;
create index TASKS_IDX4 on TASKS (MIN_ACT); 
drop index if exists TASKS_IDX5;
create index TASKS_IDX5 on TASKS (MAX_ACT); 

drop table if exists DUAL;
create table DUAL (DUMMY varchar(1) );
insert into DUAL (DUMMY) values ('X');
