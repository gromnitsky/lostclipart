CREATE TABLE users(uid INTEGER PRIMARY KEY,
       	     	   name UNIQUE NOT NULL,
                   pw_hash NOT NULL,
                   blob NOT NULL,
                   gecos,
		   registered INT NOT NULL,
		   grp NOT NULL);

INSERT INTO users(uid, name, pw_hash, blob, registered, grp)
       VALUES (0, 'admin',
	       '$2b$12$Wi9EaIjnWkR4/qj2wvR/EOYLNWSPlXe9LA.Xu5RtL6DFa9ZiFXb7K',
               'xxx', strftime('%s','now'), 'adm');
