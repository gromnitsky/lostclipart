let crypto = require('crypto')
let fs = require('fs')
let path = require('path')
let util = require('util')
let Database = require('better-sqlite3')

exports.log = {
    debug: sd_log.bind(console, 7, ""),
    error: sd_log.bind(console, 3, ""),
    sqlite: sd_log.bind(console, 7, "sqlite"),
    user: sd_log.bind(console, 5, "user"),
    image: sd_log.bind(console, 5, "image"),
}

exports.db_open = function(conf) {
    let custom_sqlite_functions = db => {
        db.pragma('foreign_keys = ON')
        db.function('rmatch', (re, str) => Number(new RegExp(re).test(str)))
    }

    let open = (file, sql) => {
        let opt = { verbose: conf.devel ? exports.log.sqlite : null }
        let db; try {
            db = new Database(file,
                              Object.assign({}, {fileMustExist: true}, opt))
            custom_sqlite_functions(db)
        } catch (e) {           // 1st run
            fs.mkdirSync(path.dirname(file), {recursive: true})
            db = new Database(file, opt)
            custom_sqlite_functions(db)
            db.exec(fs.readFileSync(sql).toString())
            db.prepare(`UPDATE users SET blob = ? WHERE uid = 0`)
                .run(crypto.randomBytes(1024))
        }
        return db
    }

    return open(conf.db, __dirname + '/schema.sql')
}

exports.Conf = function(out = '_out') {
    this.server = { port: 3000 }
    this.img = path.join(out, 'img')
    this.upload = {
        dir: path.join(out, 'tmp'),
        max_files_size: 5*1024*1024,
    },
    this.tags = { perimage: 5 }
    this.search = { perpage: 6 }
    this.client = { dir: path.join(out, 'client') }
    this.db = path.join(out, 'db.sqlite3')
    this.devel = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'

    fs.mkdirSync(this.upload.dir, {recursive: true})

    try {
        Object.assign(this,JSON.parse(fs.readFileSync(out+'/server.conf.json')))
    } catch(e) {
        // do nothing
    }
}

exports.is_str = function(s) {
    return Object.prototype.toString.call(s) === "[object String]"
}

function sd_log(level, src, ...args) {
    let to_s = v => exports.is_str(v) ? v : util.inspect(v)
    let prefix = `<${level}>${src}${src ? ': ' : ''}`
    console.log(prefix+args.map( v => {
        return to_s(v).split("\n").join(`\n${prefix}`)
    }).join` `)
}
