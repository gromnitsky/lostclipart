// must be browserified for a web client
'use strict';

let minimist = require('minimist')
let shellwords = require("shellwords")

exports.query_parse = function(args) {
    let opt = {
        boolean: ['r'],
        string: ['u', 't', 'l', 'last_uploaded', 'last_iid'],
    }
    let argv = minimist(Array.isArray(args) ? args : shellwords.split(args),opt)
    let unknown = Object.keys(argv).filter( k => !(opt.boolean.includes(k)
                                                   || opt.string.includes(k)
                                                   || k === '_'))
    if (unknown.length) throw new Error(`unknown options: ${unknown}`)

    let r = {
        user_name: Array.isArray(argv.u) ? argv.u[0] : argv.u,
        tags: argv.t ? (Array.isArray(argv.t) ? argv.t : [argv.t]) : [],
        sort: argv.r ? 'DESC' : 'ASC',
        license: Array.isArray(argv.l) ? argv.l[0] : argv.l,
        last_uploaded: Number(argv.last_uploaded || 0),
        last_iid: Number(argv.last_iid || 0),
        _: argv._.map(v => v.trim()).filter(Boolean).join` `,
    }
    if (argv.r && !argv.last_uploaded) r.last_uploaded = '9e999' // infinity
    if (argv.r && !argv.last_iid) r.last_iid = '9e999'
    return r
}
