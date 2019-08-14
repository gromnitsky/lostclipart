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

        let query_parse = input => {
            return new Tokens(input, ctrl.selectionStart)
        }
        let trigger_on_change = val => this.props.onChange(val)

        let opt = Object.assign(this.props.opt || {}, {
            filter: function(text, input) {
                return Awesomplete.FILTER_CONTAINS(text, query_parse(input).current())
            },
            item: function(text, input) {
                return Awesomplete.ITEM(text, query_parse(input).current())
            },
            replace: function(text) {
                // inject a new item to the current input
                text = search.sq(text)
                let t = query_parse(this.input.value)
                let other = a => a + (a.length ?  ' ' : '')
                this.input.value = other(t.left().trimRight()) + text + ' ' + t.right()
                // set cursor position
                // let cursor = t.left().length + text.length +
                //     (t.right().length ? 1 : 2)
                // this.input.selectionStart = cursor
                // this.input.selectionEnd = cursor

                // emulate onchange event
                trigger_on_change(this.input.value)
            }
        })
        let awsmplt = new Awesomplete(ctrl, opt)
        ctrl.addEventListener('awesomplete-close', () => {
            // don't display suggestions until the next
            // this.props.completions() run
            awsmplt.list = []
        })

        let input_listener = u.debounce( evt => {
            let t = query_parse(evt.target.value)
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
