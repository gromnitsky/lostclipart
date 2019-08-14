/* global React, Awesomplete, search */

import * as u from './u.js'
import * as ic from './image_common.js'

export default class AwesompleteInput extends React.Component {
    constructor(props) {
        super(props)
        this.ctrl = this.props.inner_ref
    }

    render() {
        let {inner_ref, ...rest} = this.props
        return <input ref={this.ctrl} {...rest} />
    }

    componentDidMount() {
        let ctrl = this.ctrl.current

        let parse = str => {
           try {
                return new Tokens(str == null ? ctrl.value : str,
                                  ctrl.selectionStart)
            } catch (e) {
                return parse('')
            }
        }

        let opt = Object.assign(this.props.opt || {}, {
            filter: function(text, _input) {
                return Awesomplete.FILTER_CONTAINS(text, parse().current())
            },
            item: function(text, _input) {
                return Awesomplete.ITEM(text, parse().current())
            },
            replace: function(text) { // inject a new item to the current input
                let t = parse()
                if (!t.current().length) return

                text = search.sq(text)
                let other = a => a + (a.length ?  ' ' : '')
                ctrl.value = other(t.left().trimRight()) + text + ' ' + t.right()
            }
        })
        let awsmplt = new Awesomplete(ctrl, opt)
        ctrl.addEventListener('awesomplete-close', () => {
            // don't display suggestions until the next
            // this.props.completions() run
            awsmplt.list = []
        })

        let input_listener = u.debounce( () => {
            let t = parse()
            let user_input = t.current()
            let run = list => {
                awsmplt.list = list
                awsmplt.evaluate()
            }

            switch (t.prev()) {
            case '-l':
                u.fetch_json('/api/licenses').
                    then( r => r.map( v => v.name)).then(run)
                break
            case '-t':
                if (user_input.length >= awsmplt.minChars)
                    ic.tags_completions(user_input).then(run)
                break
            }
        }, 200)
        ctrl.addEventListener('input',  input_listener)
    }
}

class Tokens {
    constructor(str, cursor) {
        this.str = str
        this.tokens = search.shellwords2.split(str)
        this.cur_idx = this.findIndex(cursor)
        this.cur = this.tokens[this.cur_idx]
    }

    current() { return this.cur ? this.cur.value : '' }

    findIndex(cursor) {
        return this.tokens.findIndex( t => {
            return cursor >= t.begin && cursor <= t.end
        })
    }

    left() {
        if (!this.cur) return ''
        let t = this.tokens.slice(0, this.cur_idx)
        let rightmost = t[t.length - 1]
        return rightmost ? this.str.slice(0, rightmost.end) : ''
    }

    right() {
        if (!this.cur) return ''
        let t = this.tokens.slice(this.cur_idx + 1)
        let leftmost = t[0]
        return leftmost ? this.str.slice(leftmost.begin) : ''
    }

    prev() {
        let r = this.tokens[this.cur_idx - 1]
        return r ? r.value : ''
    }
}
