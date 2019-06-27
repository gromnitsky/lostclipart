CREATE TABLE users(uid INTEGER PRIMARY KEY,
       	     	   name UNIQUE NOT NULL,
                   pw_hash NOT NULL,
                   blob NOT NULL,
                   gecos,
		   registered INT NOT NULL);
CREATE TABLE groups(gid INTEGER PRIMARY KEY, name UNIQUE NOT NULL);
CREATE TABLE users_groups(uid INT NOT NULL, gid INT NOT NULL);

INSERT INTO users(uid, name, pw_hash, blob, registered)
       VALUES (0, 'admin',
	       '$2b$12$Wi9EaIjnWkR4/qj2wvR/EOYLNWSPlXe9LA.Xu5RtL6DFa9ZiFXb7K',
               'xxx', strftime('%s','now'));
INSERT INTO groups VALUES (10, 'wheel');
INSERT INTO groups VALUES (100, 'users');
INSERT INTO users_groups VALUES (0,10);
