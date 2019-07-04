let crypto = require('crypto')
let fs = require('fs')
let path = require('path')

let connect = require('connect')
let cookie = require('cookie')
let bcrypt = require('bcrypt')
let Database = require('better-sqlite3')
let co_body = require('co-body')
let serve_static = require('serve-static')

let db = db_open()
let app = connect()

app.use('/api/user', (req, res, next) => {
    if (req.method !== 'POST') return next(new AERR(405, 'Method Not Allowed'))
    next()
})

app.use('/api/user', (req, res, next) => {
    co_body.form(req, {limit: '1kb'}).then( body => {
	req.body = body
	next()
    }).catch(next)
})

app.use('/api/user/profile', (req, res, next) => { // FIXME: should be GET
    let user = db.users.prepare(`SELECT uid,name,grp,gecos,registered FROM users WHERE uid = ?`).get(req.body.uid)
    if (!user) return next(new AERR(400, 'invalid uid'))
    res.end(JSON.stringify(user))
})

app.use('/api/user/new', async (req, res, next) => {
    if (!validate_name(req.body.name)) return next(new AERR(412, 'bad name'))
    if (db.users.prepare(`SELECT name FROM users WHERE name = ?`)
	.get(req.body.name)) {
	return next(new AERR(412, `user ${req.body.name} already exists`))
    }

    if (!validate_password(req.body.password))
	return next(new AERR(412, 'bad password'))

    let gecos = (req.body.gecos || '').slice(0, 512)
    let uid = await user_add(req.body.name, req.body.password,
			     gecos, Math.floor(new Date()/1000))
    res.end(JSON.stringify(token(uid)))
})

app.use('/api/user/login', async (req, res, next) => {
    let error = () => next(new AERR(412, 'bad cridentials'))

    let user = db.users.prepare(`SELECT uid,pw_hash FROM users WHERE name = ?`)
	.get(req.body.name)
    if (!user) { return error() }

    if (await bcrypt.compare(req.body.password || '', user.pw_hash)) {
	return res.end(JSON.stringify(token(user.uid)))
    }
    error()
})

app.use('/api/user/edit', (req, res, next) => {
    let session = session_uid(req)
    if (session.uid < 0) return next(new AERR(412, 'bad session token'))

    let uid = Number(req.body.uid)
    let target = db.users.prepare(`SELECT grp FROM users WHERE uid = ?`).get(uid)

    if ( !(session.uid === uid || session.grp === 'adm')
	 || (uid === 0 && session.uid !== 0)
	 || (target.grp === 'adm' && session.uid !== 0))
	return next(new AERR(403, 'session token is invalid for the op'))

    next()
})

app.use('/api/user/edit/misc', (req, res, next) => {
    let target = db.users.prepare(`SELECT name FROM users WHERE uid = ?`)
	.get(req.body.uid)
    if (!target) return next(new AERR(403, 'invalid uid'))

    if (!validate_name(req.body.name)) return next(new AERR(412, 'bad name'))
    let gecos = (req.body.gecos || '').slice(0, 512)

    if (target.name !== req.body.name && // FIXME: rm & just check UPDATE below
	db.users.prepare(`SELECT name FROM users WHERE name = ?`)
	.get(req.body.name)) {
	return next(new AERR(412, `user ${req.body.name} already exists`))
    }

    db.users.prepare(`UPDATE users SET name = ?, gecos = ? WHERE uid = ?`)
	.run(req.body.name, gecos, req.body.uid)
    res.end()
})

app.use('/api/user/edit/password', async (req, res, next) => {
    if (!validate_password(req.body.password))
	return next(new AERR(412, 'bad password'))

    if (db.users
	.prepare(`UPDATE users SET pw_hash = ? WHERE uid = ?`)
	.run(await pw_hash_mk(req.body.password), req.body.uid).changes === 0)
	return next(new AERR(412, 'invalid uid'))

    res.end(JSON.stringify(token(req.body.uid)))
})


app.use(serve_static('_out/client'))

app.use((req, res, next) => {	// in 404 stead
    let error = () => next(new AERR(404, 'Not Found'))
    if (req.method !== 'GET') return error()
    let pathname = new URL(`http://example.com/${req.url}`).pathname
    if (pathname.indexOf('.') !== -1) return error()

    fs.createReadStream('_out/client/index.html').pipe(res)
})

app.listen(3000)


function db_open() {
    let open = (file, sql) => {
	let db; try {
	    db = new Database(file, {fileMustExist: true})
	} catch (e) {		// 1st run
	    fs.mkdirSync(path.dirname(file), {recursive: true})
	    db = new Database(file)
	    db.pragma('foreign_keys = ON')
	    db.exec(fs.readFileSync(sql).toString())
	}
	return db
    }
    let users = open('_out/db/users.sqlite3', 'users.sql')
    users.prepare(`UPDATE users SET blob = ? WHERE uid = 0`)
	.run(crypto.randomBytes(1024))
    return {
	users,
	images: open('_out/db/images.sqlite3', 'images.sql')
    }
}

function validate_name(s) { return s && /^\w{2,20}$/.test(s) }
function validate_password(s) { return s && s.length >= 10 }

function cookie_set(res, name, val, opt) {
    res.setHeader('set-cookie', cookie.serialize(name, val, opt))
}
function cookie_get(req, name) {
    return cookie.parse(req.headers.cookie || '')[name]
}

// return a fresh uid
async function user_add(name, password, gecos, registered) {
    let pw_hash = await pw_hash_mk(password)
    return db.users
	.prepare(`INSERT INTO users(name,pw_hash,blob,gecos,registered,grp)
                  VALUES (?,?,?,?,?,?)`)
	.run(name, pw_hash, crypto.randomBytes(1024),
	     gecos, registered, 'users')
	.lastInsertRowid
}

function pw_hash_mk(password) { return bcrypt.hash(password, 12) }

function token(uid) {
    let user = db.users.prepare(`SELECT pw_hash,blob FROM users WHERE uid = ?`)
	.get(uid)
    let exp_date = Date.now() + 60*60*24*30*3 * 1000 // 90 days
    return {
	uid,
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

    let user = db.users.prepare(`SELECT * FROM users WHERE uid = ?`).get(uid)
    if (!user) return { uid: -1 }

    if (token !== token_mk(user.pw_hash, exp_date, user.blob)) return {uid: -2}
    return user
}

class AERR extends Error {
    constructor(status, msg) {
	super(msg)
	Error.captureStackTrace(this, AERR)
	this.name = 'ApiError'
	this.status = status
  }
}
