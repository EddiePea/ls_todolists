CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);

CREATE TABLE todolists (
  id serial PRIMARY KEY,
  title varchar(100) NOT NULL UNIQUE,
  username text NOT NULL 
);

CREATE TABLE todos (
  id serial PRIMARY KEY,
  title varchar(100) NOT NULL,
  done boolean NOT NULL DEFAULT false,
  username text NOT NULL,
  todo_list_id integer 
    NOT NULL
    REFERENCES todolists (id) 
    ON DELETE CASCADE
);

ALTER TABLE todolists
ADD CONSTRAINT "username_fk"
FOREIGN KEY (username) REFERENCES users(username)
ON DELETE CASCADE;

ALTER TABLE todos
ADD CONSTRAINT "username_fk"
FOREIGN KEY (username) REFERENCES users(username)
ON DELETE CASCADE;