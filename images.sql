-- -*- sql[sqlite] -*-

CREATE TABLE licenses(lid INTEGER PRIMARY KEY, name NOT NULL);
INSERT INTO licenses(name) VALUES ('unknown');
INSERT INTO licenses(name) VALUES ('public domain');
INSERT INTO licenses(name) VALUES ('CC BY');
INSERT INTO licenses(name) VALUES ('CC BY-SA');

CREATE TABLE images(iid INTEGER PRIMARY KEY,
                    uid INT NOT NULL,
		    md5 UNIQUE NOT NULL,
                    filename NOT NULL,
                    mtime INT NOT NULL,
		    size INT NOT NULL,
                    uploaded INT NOT NULL,
                    desc,
                    lid INT NOT NULL,
		    FOREIGN KEY(lid) REFERENCES licenses(lid));

CREATE TABLE tags(tid INTEGER PRIMARY KEY,
                  name NOT NULL,
		  desc);

CREATE TABLE images_tags(iid INT NOT NULL,
                         tid INT NOT NULL,
                         FOREIGN KEY(iid) REFERENCES images(iid)
                         FOREIGN KEY(tid) REFERENCES tags(tid));

CREATE INDEX images_tags_idx ON images_tags(iid, tid);
