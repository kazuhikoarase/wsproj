
drop sequence SEQ_TASK_ID if exists;
create sequence SEQ_TASK_ID as bigint start with 1 increment by 1;

drop table TASKS if exists;
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

drop table USERS if exists;
create table USERS (
  USER_ID varchar(32) not null,
  JSON_DATA varchar(100000) not null,
  primary key (USER_ID)
);

drop table PROJECTS if exists;
create table PROJECTS (
  PROJECT_ID varchar(32) not null,
  JSON_DATA varchar(100000) not null,
  primary key (PROJECT_ID)
);

drop index TASKS_IDX1 if exists;
create index TASKS_IDX1 on TASKS (PROJECT_ID,DEL_FLG); 
drop index TASKS_IDX2 if exists;
create index TASKS_IDX2 on TASKS (TERM); 
drop index TASKS_IDX3 if exists;
create index TASKS_IDX3 on TASKS (USER_ID); 
drop index TASKS_IDX4 if exists;
create index TASKS_IDX4 on TASKS (MIN_ACT); 
drop index TASKS_IDX5 if exists;
create index TASKS_IDX5 on TASKS (MAX_ACT); 

drop table DUAL if exists;
create table DUAL (DUMMY varchar(1) );
insert into DUAL (DUMMY) values ('X');
