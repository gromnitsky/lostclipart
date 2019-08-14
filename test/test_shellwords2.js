#!/opt/bin/mocha --ui=tdd
'use strict';

let assert = require('assert')
let split = require('../lib/shellwords2').split

suite('split', function() {
    test('normal words', function() {
        assert.deepEqual(split(""), [])
        assert.deepEqual(split("foo bar baz"), [
            { begin: 0, end: 4, value: 'foo'},
            { begin: 4, end: 8, value: 'bar' },
            { begin: 8, end: 11, value: 'baz' }
        ])
    })

    test('single quoted phrases', function() {
        assert.deepEqual(split("foo 'bar baz'"), [
            { begin: 0, end: 4, value: 'foo'},
            { begin: 4, end: 13, value: 'bar baz' },
        ])
    })

    test('double quoted phrases', function() {
        assert.deepEqual(split('"foo bar" baz'), [
            { begin: 0, end: 10, value: 'foo bar'},
            { begin: 10, end: 13, value: 'baz' },
        ])
    })

    test('escaped characters', function() {
        test_split("foo\\ bar baz", ["foo bar", "baz"])
    })

    test('escaped characters within single quotes', function() {
        assert.deepEqual(split("foo 'bar\\ baz'"), [
            { begin: 0, end: 4, value: 'foo'},
            { begin: 4, end: 14, value: 'bar baz' },
        ])
    })

    test('escaped characters within double quotes', function() {
        test_split('foo "bar\\ baz"', ["foo", "bar baz"])
    })

    test('escaped quotes within quotes', function() {
        test_split('foo "bar\\" baz"', ['foo', 'bar" baz'])
        test_split("foo 'bar\\' baz'", ['foo', "bar' baz"])
    })

    test('throws on unmatched single quotes', function() {
        assert.throws( () => split("foo 'bar baz"))
    })

    test('throws on unmatched double quotes', function() {
        assert.throws( () => split('foo "bar baz'))
    })
})

function test_split(str, expected) {
    let r = split(str).map( v => v.value)
    assert.deepEqual(r, expected)
}
