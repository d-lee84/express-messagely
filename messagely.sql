\echo 'Delete and recreate messagely db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE messagely;
CREATE DATABASE messagely;
\connect messagely


CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  join_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  reset_code TEXT,
  reset_req TEXT);

 INSERT INTO users (
   username, 
   password, 
   first_name, 
   last_name, 
   phone, 
   join_at,
   last_login_at)
        VALUES ('kellenrowe', 
                '$2b$12$x.nDdDX6Sp5o0j5vx4PNDOXezZEWGlaru2F0awrhp9eD/9UN.vWb.', 'kellen', 
                'rowe', 
                '5099542937', 
                current_timestamp, 
                current_timestamp);
 INSERT INTO users (
   username, 
   password, 
   first_name, 
   last_name, 
   phone, 
   join_at,
   last_login_at)
        VALUES ('funkydavid', 
                '$2b$12$Zd2emhHqn8qKTtaB9XlQfek4aG30Aqd3kD4nOzCM7I1PBQCN4t6WO', 'david', 
                'lee', 
                '4086004900', 
                current_timestamp, 
                current_timestamp);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  from_username TEXT NOT NULL REFERENCES users,
  to_username TEXT NOT NULL REFERENCES users,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE);


\echo 'Delete and recreate messagely_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE messagely_test;
CREATE DATABASE messagely_test;
\connect messagely_test

CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  join_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  from_username TEXT NOT NULL REFERENCES users,
  to_username TEXT NOT NULL REFERENCES users,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE);

