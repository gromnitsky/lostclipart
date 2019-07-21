-- -*- sql[sqlite] -*-

CREATE TABLE users(uid INTEGER PRIMARY KEY,
                   name UNIQUE NOT NULL COLLATE NOCASE
                        CHECK(rmatch('^[a-zA-Z0-9_]{2,20}$', name)),
                   pw_hash NOT NULL,
                   blob NOT NULL,
                   gecos,
                   registered INT NOT NULL,
                   grp NOT NULL,
                   status);

-- status: null, locked (no new uploads), disabled (like locked + all
-- prev uploads are hidden)

INSERT INTO users(uid, name, pw_hash, blob, registered, grp)
       VALUES (0, 'admin',
               '$2b$12$Wi9EaIjnWkR4/qj2wvR/EOYLNWSPlXe9LA.Xu5RtL6DFa9ZiFXb7K',
               'xxx', strftime('%s','now'), 'adm');

CREATE TABLE licenses(lid INTEGER PRIMARY KEY, name NOT NULL);
INSERT INTO licenses(name) VALUES ('unknown');
INSERT INTO licenses(name) VALUES ('public domain');
INSERT INTO licenses(name) VALUES ('CC BY');
INSERT INTO licenses(name) VALUES ('CC BY-SA');

CREATE TABLE images(iid INTEGER PRIMARY KEY,
                    uid INT NOT NULL,
                    md5 UNIQUE NOT NULL,
                    filename NOT NULL CHECK(length(trim(filename)) > 0),
                    mtime INT NOT NULL CHECK(rmatch('^[0-9.]+$', mtime)),
                    size INT NOT NULL,
                    uploaded INT NOT NULL,
		    title NOT NULL CHECK(length(trim(title)) > 0),
                    desc,
                    lid INT NOT NULL,
                    FOREIGN KEY(uid) REFERENCES users(uid)
		    FOREIGN KEY(lid) REFERENCES licenses(lid));

CREATE TABLE tags(tid INTEGER PRIMARY KEY,
                  name UNIQUE NOT NULL COLLATE NOCASE,
                  desc);
INSERT INTO tags(name) VALUES ('man');
INSERT INTO tags(name) VALUES ('woman');
INSERT INTO tags(name) VALUES ('cat');
INSERT INTO tags(name) VALUES ('dog');
INSERT INTO tags(name) VALUES ('100%');

CREATE TABLE images_tags(iid INT NOT NULL,
                         tid INT NOT NULL,
                         FOREIGN KEY(iid) REFERENCES images(iid)
                         FOREIGN KEY(tid) REFERENCES tags(tid));

CREATE INDEX images_tags_idx ON images_tags(iid, tid);

CREATE VIEW images_view AS
       SELECT tags.name as tag,
              images_tags.tid,
              images.*,
              licenses.name AS license,
              users.name AS user_name,
              users.grp AS user_grp,
              users.status AS user_status
       FROM tags
       INNER JOIN images_tags ON images_tags.tid == tags.tid
       LEFT JOIN images ON images.iid == images_tags.iid
       LEFT JOIN licenses ON licenses.lid = images.lid
       LEFT JOIN users ON users.uid = images.uid;

create view tags_view as
       select images_tags.*, tags.name
       from tags
       inner join images_tags ON images_tags.tid == tags.tid
