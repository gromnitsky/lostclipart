let crypto = require('crypto')
let fs = require('fs')

let connect = require('connect')
let cookie = require('cookie')
let bcrypt = require('bcrypt')
let Database = require('better-sqlite3')
let co_body = require('co-body')

let users = db_users_open()
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

app.use('/api/user/new', async (req, res, next) => {
    if (!validate_name(req.body.name)) return next(new AERR(412, 'bad name'))
    if (users.prepare(`SELECT name FROM users WHERE name = ?`)
	.get(req.body.name)) {
	return next(new AERR(412, `user ${req.body.name} already exists`))
    }

    if (!validate_password(req.body.password))
	return next(new AERR(412, 'bad password'))

    let gecos = (req.body.gecos || '').slice(0, 512)
    let uid = await user_add(req.body.name, req.body.password,
			     gecos, new Date()/1000)
    res.end(JSON.stringify(token(uid)))
})

app.use('/api/user/login', async (req, res, next) => {
    let error = () => next(new AERR(412, 'bad cridentials'))

    let user = users.prepare(`SELECT uid,pw_hash FROM users WHERE name = ?`)
	.get(req.body.name)
    if (!user) { return error() }

    if (await bcrypt.compare(req.body.password || '', user.pw_hash)) {
	return res.end(JSON.stringify(token(user.uid)))
    }
    error()
})

app.use('/api/user/edit', async (req, res, next) => {
    let uid = session_uid(req)
    if (uid < 0) return next(new AERR(412, 'bad session token'))

    if (!(validate_name(req.body.name) && validate_password(req.body.password)))
	return next(new AERR(412, 'bad name/password'))
    let gecos = (req.body.gecos || '').slice(0, 512)
    let pw_hash = await pw_hash_mk(req.body.password)

    users.prepare(`UPDATE users SET name = ?, pw_hash = ?, gecos = ?
                   WHERE uid = ?`).run(req.body.name, pw_hash, gecos, uid)
    res.end()
})

app.listen(3000)


function db_users_open() {
    let db; try {
	db = new Database('users.sqlite3', {fileMustExist: true})
    } catch (e) {		// 1st run
	db = new Database('users.sqlite3')
	db.exec(fs.readFileSync('users.sql').toString())
	db.prepare(`UPDATE users SET blob = ? WHERE uid = 0`)
	    .run(crypto.randomBytes(1024))
    }
    return db
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
    let info = users
	.prepare(`INSERT INTO users(name,pw_hash,blob,gecos,registered)
                  VALUES (?,?,?,?,?)`)
	.run(name, pw_hash, crypto.randomBytes(1024), gecos, registered)

    users.prepare(`INSERT INTO users_groups VALUES (?,?)`)
	.run(info.lastInsertRowid, 100)
    return info.lastInsertRowid
}

function pw_hash_mk(password) { return bcrypt.hash(password, 12) }

function token(uid) {
    let user = users.prepare(`SELECT pw_hash,blob FROM users WHERE uid = ?`)
	.get(uid)
    let exp_date = Date.now() + 60*60*24*30*3 // 90 days
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

    let user = users.prepare(`SELECT pw_hash,blob FROM users WHERE uid = ?`)
	.get(uid)
    if (!user) return -1

    if (token !== token_mk(user.pw_hash, exp_date, user.blob)) return -2
    return uid
}

class AERR extends Error {
    constructor(status, msg) {
	super(msg)
	Error.captureStackTrace(this, AERR)
	this.name = 'ApiError'
	this.status = status
  }
}
