let crypto = require('crypto')
let fs = require('fs')
let path = require('path')
let Database = require('better-sqlite3')

exports.db_open = function(conf) {
    let custom_sqlite_functions = db => {
        db.pragma('foreign_keys = ON')
        db.function('rmatch', (re, str) => Number(new RegExp(re).test(str)))
    }

    let open = (file, sql) => {
        let opt = { verbose: conf.devel ? console.log : null }
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
    this.img = path.join(out, 'img')
    this.upload = {
        dir: path.join(out, 'tmp'),
        max_files_size: 5*1024*1024,
    },
    this.tags = { perimage: 5 }
    this.client = { dir: path.join(out, 'client') }
    this.db = path.join(out, 'db.sqlite3')
    this.devel = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'

    fs.mkdirSync(this.upload.dir, {recursive: true})
}
