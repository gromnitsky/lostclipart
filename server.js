let crypto = require('crypto')
let fs = require('fs')
let path = require('path')
let util = require('util')

let readFile = util.promisify(fs.readFile)
let mkdir = util.promisify(fs.mkdir)
let rename = util.promisify(fs.rename)

let connect = require('connect')
let cookie = require('cookie')
let bcrypt = require('bcrypt')
let co_body = require('co-body')
let serve_static = require('serve-static')
let multiparty = require('multiparty')
let mmm = require('mmmagic')
let SqliteError = require('better-sqlite3').SqliteError

let u = require('./u')
let search = require('./lib/search')

let conf = new u.Conf()
let db = u.db_open(conf)
let app = connect()

if (conf.devel) u.log.debug(process.env)

app.use('/', (req, res, next) => {
    if (req.method === 'GET') req.searchparams = new URLSearchParams(req.url.slice(req.url.search(/[?&]/)+1))
    next()
})

app.use('/api/user', (req, res, next) => {
    if (req.method !== 'POST') return next(new AERR(405, 'Method Not Allowed'))
    co_body.form(req, {limit: '1kb'}).then( body => {
        req.body = body
        next()
    }).catch(next)
})

app.use('/api/user/profile', (req, res, next) => {
    let user = db.prepare(`SELECT uid,name,grp,gecos,registered,status,(select count(iid) from images where uid=@uid) AS uploads FROM users WHERE uid = @uid`).get({uid: req.body.uid})
    if (!user) return next(new AERR(404, 'invalid uid'))
    res.end(JSON.stringify(user))
})

app.use('/api/user/new', async (req, res, next) => {
    if (!validate_password(req.body.password))
        return next(new AERR(400, 'bad password'))

    let gecos = (req.body.gecos || '').slice(0, 512)
    user_add(req.body.name, req.body.password, gecos, today()).then( uid => {
        u.log.user('new:', req.body.name)
        res.end(JSON.stringify(token(uid)))
    }).catch(e => next(new AERR(409, e)))
})

app.use('/api/user/login', async (req, res, next) => {
    let error = () => next(new AERR(400, 'bad cridentials'))

    let user = db.prepare(`SELECT uid,pw_hash,status FROM users WHERE name = ?`)
	.get(req.body.name)
    if (!user) { return error() }
    if (user.status === 'disabled') return next(new AERR(403, `user ${user.uid} (${req.body.name}) is disabled`))

    if (await bcrypt.compare(req.body.password || '', user.pw_hash)) {
	return res.end(JSON.stringify(token(user.uid)))
    }
    error()
})

app.use('/api/user/edit', (req, res, next) => {
    let session = session_uid(req)
    if (session.uid < 0) return next(new AERR(400, 'bad session token'))

    let uid = Number(req.body.uid)
    let target = db.prepare(`SELECT grp FROM users WHERE uid = ?`).get(uid)

    if ( !(session.uid === uid || session.grp === 'adm')
	 || (uid === 0 && session.uid !== 0)
	 || (target.grp === 'adm' && session.uid !== 0))
	return next(new AERR(403, 'session token is invalid for the op'))

    next()
})

app.use('/api/user/edit/misc', (req, res, next) => {
    let gecos = (req.body.gecos || '').slice(0, 512)
    try {
        db.prepare(`UPDATE users SET name = ?, gecos = ? WHERE uid = ?`)
            .run(req.body.name, gecos, req.body.uid)
    } catch(e) {
        return next(new AERR(400, e))
    }
    u.log.user('edit:', req.body.name)
    res.end()
})

app.use('/api/user/edit/password', async (req, res, next) => {
    if (!validate_password(req.body.password))
	return next(new AERR(400, 'bad password'))

    if (db.prepare(`UPDATE users SET pw_hash = ? WHERE uid = ?`)
	.run(await pw_hash_mk(req.body.password), req.body.uid).changes === 0)
	return next(new AERR(400, 'invalid uid'))

    res.end(JSON.stringify(token(req.body.uid)))
})

app.use('/api/image/upload', (req, res, next) => {
    if (req.method !== 'POST') return next(new AERR(405, 'expected POST'))
    let session = session_uid(req)
    if (session.uid < 0) return next(new AERR(400, 'bad session token'))

    let form = new multiparty.Form({
        maxFilesSize: conf.upload.max_files_size,
        uploadDir: conf.upload.dir,
    })
    // rm tmp uploads
    let cleanup = files => files && Object.keys(files).forEach( k => {
        files[k].forEach(v => fs.unlink(v.path, ()=>{}))
    })

    let attachments = async (fields, files) => {
        if ( !(fields.tags && validate_tags(fields.tags[0])))
            throw new Error('no tags')
        if ( !('svg' in files && 'thumbnail' in files))
            throw new Error('2 attachments are required')
	let att = {
	    svg: {
		file: files.svg[0],
		md5: await md5_file(files.svg[0].path)
	    },
	    thumbnail: files.thumbnail[0],
	}
	if ( !( (await file(att.svg.file.path)).startsWith('image/svg') &&
	       await file(att.thumbnail.path) === 'image/png') )
	    throw new Error('images are in wrong formats')
	return att
    }

    form.parse(req, (err, fields, files) => {
	let error = (code, msg) => { cleanup(files); next(new AERR(code, msg)) }
	if (err) return error(500, err.message)
	u.log.debug('upload fields:', fields)
	u.log.debug('upload files:', util.inspect(files, {depth:null}))

	let transaction = db.transaction( att => {
	    let iid = db.prepare('INSERT INTO images VALUES (NULL, @uid, @md5, @filename, @mtime, @size, @uploaded, @title, @desc, @lid)').run({
		uid: session.uid,
		md5: att.svg.md5,
		filename: att.svg.file.originalFilename,
		mtime: fields.mtime && fields.mtime[0] || today(),
		size: att.svg.file.size,
		uploaded: today(),
		title: fields.title && fields.title[0].slice(0, 128),
		desc: (fields.desc && fields.desc[0] || '').slice(0, 512),
		lid: fields.lid && fields.lid[0]
	    }).lastInsertRowid

	    tag_image(iid, fields.tags[0])
            fts_insert(iid)

	    return {att, iid}
	})

        let get_attachments = attachments(fields, files)
	get_attachments.then(transaction).then( async v => {
	    let img = search.iid2image(session.uid, v.iid, conf.img)
	    await mv(v.att.svg.file.path, img.svg)
	    await mv(v.att.thumbnail.path,  img.thumbnail)

            u.log.image('upload:', v.iid)
	    res.end(JSON.stringify({iid: v.iid}))
	}).catch( e => {
            if (e instanceof SqliteError && /\bmd5\b/.test(e.message)) {
                get_attachments.then(att => md5_to_iid(att.svg.md5)).then(iid=>{
                    e.message = iid
                }).finally( () => error(409, e))
                return
            }

	    // FIXME: rm moved files
	    error(400, e)
	})
    })
})

app.use('/api/licenses', (req, res) => {
    return res.end(JSON.stringify(db
				  .prepare(`SELECT * FROM licenses`).all()))
})

app.use('/api/tags/search', (req, res) => {
    let q = (req.searchparams.get('q') || '').trim()
    if (q.length < 2) { res.end('[]'); return }

    q = q.replace(/:/g, '::').replace(/[%_]/g, ':$&')
    let tags = db.prepare(`SELECT * FROM tags WHERE name LIKE ? ESCAPE ':' LIMIT 10`).all(`%${q}%`)
    return res.end(JSON.stringify(tags))
})

app.use('/api/tags/all', (req, res) => {
    return res.end(JSON.stringify(db.prepare(`
SELECT tags.tid, tags.name, tags.desc, count(iid) as count FROM tags
INNER JOIN images_tags ON images_tags.tid == tags.tid
GROUP BY tags.tid
ORDER BY count DESC
`).all()))
})

app.use('/api/image/view', (req, res, next) => {
    let q = db.prepare(`SELECT * FROM images_view WHERE iid = ?`)
	.all(req.searchparams.get('iid'))
    if (!q.length) return next(new AERR(404, 'invalid iid'))
    if (q[0].user_status === 'disabled')
        return next(new AERR(403, `user ${q[0].uid} (${q[0].user_name}) is disabled`))

    return res.end(JSON.stringify(q))
})

app.use('/api/image/edit', (req, res, next) => {
    if (req.method !== 'POST') return next(new AERR(405, 'Method Not Allowed'))
    co_body.form(req, {limit: '1kb'}).then( body => {
        req.body = body
        write_access_check(req, body.iid)
        next()
    }).catch( e => {
        next(new AERR(400, e))
    })
})

app.use('/api/image/edit/misc', (req, res, next) => {
    let update_col = (col) => {
        if (db.prepare(`UPDATE images SET ${col} = ? WHERE iid = ?`).
            run(req.body[col], req.body.iid).changes !== 1)
            throw new AERR(400, `${req.body.iid}: ${col}: upd failed`)
    }

    try {
        if ('tags' in req.body) {
            if (!validate_tags(req.body.tags))
                throw new AERR(400, 'invalid tags')
            db.transaction( () => {
                tag_image(req.body.iid, req.body.tags)
                fts_update_tags(req.body.iid) // depends on tag_image() work!
            })()
        }

        // our GUI allows only a single column update
        ['lid', 'filename', 'desc', 'mtime', 'title'].
            filter( col => col in req.body).forEach( col => {
                db.transaction( () => {
                    update_col(col)
                    fts_update(req.body.iid, col, req.body[col])
                })()
            })
        u.log.image('edit:', req.body.iid)
        res.end()
    } catch(e) {
        next(new AERR(400, e))
    }
})

app.use('/api/image/edit/rm', (req, res, next) => {
    try {
        db.transaction( () => {
            db.prepare('DELETE FROM images_tags WHERE iid = ?').run(req.body.iid)
            tags_orphans_delete()
            db.prepare('DELETE FROM images WHERE iid = ?').run(req.body.iid)
            fts_delete(req.body.iid)
        })()
    } catch(e) {
        next(new AERR(400, e))
    }
    u.log.image('rm:', req.body.iid)
    res.end()
})

app.use('/api/search', (req, res, next) => {
    let query
    try {
        query = search.query_parse(req.searchparams.get('q'))
    } catch (e) {
        return next(new AERR(400, e))
    }
    let [simple_pred, tags_pred] = [new SqlPredicate(), new SqlPredicate()]
    query.tags.forEach( v => tags_pred.add('matched_tag = ?', v))
    if (query.uid) simple_pred.add('i.uid = ?', query.uid)
    if (query.license) simple_pred.add('license = ?', query.license)

    let fts_query = sql_quote(`{title desc tags}: ${query._}`)
    let sql = `
SELECT count(i.iid) AS n, i.*,
       tags_view.name AS matched_tag,
       users.name AS user_name, users.status AS user_status,
       licenses.name as license
FROM images_fts AS i
INNER JOIN tags_view ON tags_view.iid = i.iid
INNER JOIN users ON users.uid = i.uid
INNER JOIN licenses ON licenses.lid = i.lid
WHERE ${query._ ? 'images_fts MATCH '+fts_query : 1}
      AND ${tags_pred.toString('OR')}
      AND user_status IS NOT 'disabled'
      AND (i.uploaded,i.iid) ${query.sort === 'ASC' ? '>' : '<'} (${query.last_uploaded},${query.last_iid})
      AND ${simple_pred.toString('AND')}
GROUP BY i.iid ${tags_pred.params.length ? 'HAVING n = '+tags_pred.params.length : ''}
ORDER BY i.uploaded ${query.sort}, i.iid ${query.sort}
LIMIT ${conf.search.perpage}
`
    res.end(JSON.stringify(db.prepare(sql)
                           .all([...tags_pred.params, ...simple_pred.params])))
})

app.use('/api/status', (req, res) => {
    return res.end(JSON.stringify(db.prepare(`SELECT
(SELECT count(iid) FROM images) AS images,
(SELECT count(tid) FROM tags) AS tags,
(SELECT count(uid) FROM users) AS users,
(SELECT uploaded FROM images ORDER BY uploaded DESC LIMIT 1) AS last_upload
`).get()))
})

app.use(serve_static(conf.client.dir))

app.use((req, res, next) => {	// in 404 stead
    let error = () => next(new AERR(404, `${req.url} Not Found`))
    if (req.method !== 'GET') return error()
    let pathname = new URL(`http://example.com/${req.url}`).pathname
    if (pathname.indexOf('.') !== -1) return error()

    fs.createReadStream(path.join(conf.client.dir, 'index.html')).pipe(res)
})

app.use( (err, req, res, _next) => {
    res.statusCode = err.status || 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('X-Error', err.toString())
    res.end(conf.devel ? err.stack : '')
    if (process.env.NODE_ENV !== 'test') {
        let r = err.stack || err.toString()
        if (res.statusCode === 404) r = err.toString()
        u.log.error(`${req.method} ${res.statusCode} ${req.url}:`, r)
    }
})

app.listen(conf.server.port || process.env('PORT'))


// "foo, bar" is ok, ", " is not
function validate_tags(s) { return /^.*[^\s,].*$/.test(s) }

function validate_password(s) { return s && s.length >= 10 }

function cookie_get(req, name) {
    return cookie.parse(req.headers.cookie || '')[name]
}

// return a fresh uid
async function user_add(name, password, gecos, registered) {
    let pw_hash = await pw_hash_mk(password)
    return db
	.prepare(`INSERT INTO users(name,pw_hash,blob,gecos,registered,grp)
                  VALUES (?,?,?,?,?,?)`)
	.run(name, pw_hash, crypto.randomBytes(1024),
	     gecos, registered, 'users')
	.lastInsertRowid
}

function pw_hash_mk(password) { return bcrypt.hash(password, 12) }

function token(uid) {
    let user = db.prepare(`SELECT name,pw_hash,blob,grp,status FROM users WHERE uid = ?`)
	.get(uid)
    let exp_date = Date.now() + 60*60*24*30*3 * 1000 // 90 days
    return {
	uid,
	name: user.name,
	grp: user.grp,
	status: user.status,
	token: token_mk(user.pw_hash, exp_date, user.blob),
	exp_date
    }
}

function token_mk(pw_hash, exp_date, blob) {
    return crypto.createHash('sha256')
	.update(pw_hash + exp_date + blob).digest('hex')
}

function session_uid(req) {
    let uid = cookie_get(req, 'uid')
    let exp_date = cookie_get(req, 'exp_date')
    let token = cookie_get(req, 'token')

    let user = db.prepare(`SELECT * FROM users WHERE uid = ?`).get(uid)
    if (!user || user.status) return { uid: -1 }

    if (token !== token_mk(user.pw_hash, exp_date, user.blob)) return {uid: -2}
    return user
}

class AERR extends Error {
    constructor(status, msg) {
	super(msg)
	msg instanceof Error ? this.stack = msg.stack : Error.captureStackTrace(this, AERR)
	this.name = 'ApiError'
	this.status = msg instanceof AERR ? msg.status : status
    }
}

function file(name) {
    return new Promise( (res, rej) => {
	let magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE)
	magic.detectFile(name, function(err, result) {
	    if (err) rej(err)
	    res(result)
	})
    })
}

function today() { return Math.floor(new Date()/1000) }

async function mv(src, dest) {
    await mkdir(path.dirname(dest), {recursive: true})
    return rename(src, dest)
}

async function md5_file(name) {
    return crypto.createHash('md5').update(await readFile(name)).digest('hex')
}

function tags_add(str) {        // return an array of tids
    let tags = (str || '').split(',').filter(Boolean).
	map( v => v.replace(/\s+/, ' ').trim().toLowerCase()).filter(Boolean).
	slice(0, conf.tags.perimage)

    let insert = db.prepare('INSERT INTO tags (name) VALUES (?)')
    return tags.map( v => {
	try {
	    return insert.run(v).lastInsertRowid
	} catch (e) {
	    if (!/\bUNIQUE\b/.test(e.message)) throw e
	    return db.prepare('SELECT tid FROM tags WHERE name = ?')
		.get(v).tid
	}
    })
}

function tag_image(iid, str) {
    // delete old tags
    db.prepare(`DELETE FROM images_tags WHERE iid = ?`).run(iid)
    // add new
    db.prepare(`INSERT INTO images_tags
                       SELECT ?,tid FROM tags WHERE tid in (${tags_add(str)})`).
        run(iid)

    tags_orphans_delete()
}

function tags_orphans() {       // return an array of tids
    return db.prepare(`SELECT tags.tid FROM tags LEFT OUTER JOIN images_tags
                           ON tags.tid = images_tags.tid
                        WHERE images_tags.iid IS null`).all().map( v => v.tid)
}

function tags_orphans_delete() {
    db.prepare(`DELETE FROM tags WHERE tid in (${tags_orphans()})`).run()
}

function write_access_check(req, iid) {
    let wa = (target_uid, target_status) => {
        let session = session_uid(req); if (session.uid < 0) return false
        return session.uid === 0
            || (!target_status
                && (session.grp === 'admin' || target_uid === session.uid))
    }
    let target = db.prepare(`SELECT uid,user_status FROM images_view WHERE iid = ? LIMIT 1`).get(iid)
    if ( !(target && wa(target.uid, target.user_status)))
        throw new AERR(403, 'Forbidden')
}

function fts_insert(iid) {
    return db.prepare(`INSERT INTO images_fts
  SELECT images.iid,uid,uploaded,title,desc,lid,
         group_concat(tags_view.name) AS tags
  FROM tags_view
  INNER JOIN images ON images.iid = tags_view.iid
  WHERE images.iid = ?
  GROUP BY images.iid`).run(iid)
}

function fts_delete(iid) {
    return db.prepare(`DELETE FROM images_fts WHERE iid = ?`).run(Number(iid))
}

function fts_update(iid, col_name, col_val) {
    if (['title', 'desc', 'lid'].indexOf(col_name) === -1) return
    return db.prepare(`UPDATE images_fts SET ${col_name} = ? WHERE iid = ?`)
        .run(col_val, Number(iid))
}

function fts_update_tags(iid) {
    iid = Number(iid)
    fts_delete(iid)
    fts_insert(iid)
}

class SqlPredicate {
    constructor() {
        this.sql = []
        this.params = []
    }
    add(template, values) {
        this.sql.push(template)
        this.params = this.params.concat(values)
    }
    toString(by) {
        return '(' + (this.sql.length ? this.sql : [1]).join(` ${by} `) + ')'
    }
}

function sql_quote(s) { return "'" + s.replace(/'/g, "''") + "'" }

function md5_to_iid(md5) {
    let image = db.prepare(`select iid from images where md5=?`).get(md5)
    if (!image) throw new AERR(404, `invalid md5`)
    return image.iid
}
