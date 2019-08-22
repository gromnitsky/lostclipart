/* global React, ReachRouter, marked */

let {navigate} = ReachRouter
import * as u from './u.js'

export default class Upload extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
        this.div = React.createRef()
        u.title('Doc')
        this.error = u.gui_error.bind(this)
    }

    componentDidMount() { this.fetch({}) }
    componentDidUpdate(prev_props) { this.fetch(prev_props) }

    fetch(prev_props) { // a case when React does more harm that good
        if (prev_props.file === this.props.file) return

        this.error('')
        u.title(this.props.file, 2)
        let doc = this.div.current

        u.fetch_text(`/doc/${this.props.file}.md`).then( text => {
            doc.innerHTML = marked(text)
            // convert all <a> to <Link>
            Array.from(doc.querySelectorAll('a')).forEach(tag => {
                tag.onclick = function(event) {
                    if (shouldNavigate(event)) { // reach/router/src/index.js
                        event.preventDefault()
                        navigate(tag.href)
                    }
                }
            })

        }).catch( e => {
            this.error(e)
            doc.innerHTML = ''
        })
    }

    render() {
        let prank = {}
        if (['terms', 'privacy'].indexOf(this.props.file) !== -1)
            prank = { fontSize: '8px' }
        return (
            <>
              <div className="form-error">{this.state.error}</div>
              <div id="doc" style={prank} ref={this.div} />
            </>
        )
    }
}

let shouldNavigate = event =>
    !event.defaultPrevented &&
    event.button === 0 &&
    !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
