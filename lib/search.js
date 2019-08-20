// must be browserified for a web client
'use strict';

let minimist = require('minimist')
let shellwords2 = require("./shellwords2")

exports.shellwords2 = shellwords2

function shellwords_split(str) {
    return shellwords2.split(str).map( t => t.value)
}

exports.query_parse = function(args) {
    let opt = {
        boolean: ['r'],
        string: ['u', 't', 'l', 'last_uploaded', 'last_iid'],
    }
    let argv = minimist(Array.isArray(args) ? args : shellwords_split(args),opt)
    let unknown = Object.keys(argv).filter( k => !(opt.boolean.includes(k)
                                                   || opt.string.includes(k)
                                                   || k === '_'))
    if (unknown.length) throw new Error(`unknown options: ${unknown}`)

    let r = {
        uid: Number(Array.isArray(argv.u) ? argv.u[0] : argv.u),
        tags: argv.t ? (Array.isArray(argv.t) ? argv.t : [argv.t]) : [],
        sort: argv.r ? 'DESC' : 'ASC',
        license: Array.isArray(argv.l) ? argv.l[0] : argv.l,
        last_uploaded: Number(argv.last_uploaded || 0),
        last_iid: Number(argv.last_iid || 0),
        _: argv._.map(v => String(v).trim()).filter(Boolean).join` `,
    }
    if (argv.r && !argv.last_uploaded) r.last_uploaded = '9e999' // infinity
    if (argv.r && !argv.last_iid) r.last_iid = '9e999'
    return r
}

exports.sq = function(s) {
    return /^[\w-,/]+$/.test(s) ? s : "'" + s.toString().replace(/'/g, "'\\''") + "'"
}

// the reverse of query_parse()
exports.querify = function(pq) {
    let simple = (k, opt) => pq[k] ? `${opt} ` + exports.sq(pq[k]) : ''
    return Object.keys(pq).map( k => {
        switch (k) {
        case 'uid': return simple(k, '-u')
        case 'tags': return pq[k].map( tag => `-t ${exports.sq(tag)}`).join` `
        case 'sort': return pq[k] === 'DESC' ? '-r' : ''
        case 'license': return simple(k, '-l')
        case 'last_uploaded': return simple(k, '--last_uploaded')
        case 'last_iid': return simple(k, '--last_iid')
        case '_': return pq[k]
        default: return ''
        }
    }).filter(Boolean).join` `
}

exports.iid2image = function(uid, iid, dir) {
    return {
	svg: [dir, 'images', uid, `${iid}.svg`].join('/'),
	thumbnail: [dir, 'thumbnails', uid, `${iid}.png`].join('/')
    }
}
