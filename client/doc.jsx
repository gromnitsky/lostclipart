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
        u.fetch_text(`/doc/${this.props.file}.md`).then( text => {
            this.div.current.innerHTML = marked(text)
            // convert all <a> to <Link>
            Array.from(this.div.current.querySelectorAll('a')).forEach(tag => {
                tag.onclick = function(event) {
                    if (shouldNavigate(event)) { // reach/router/src/index.js
                        event.preventDefault()
                        navigate(tag.href)
                    }
                }
            })
        }).catch( e => {
            this.error(e)
            this.div.current.innerHTML = ''
        })
    }

    render() {
        return (
            <>
              <div className="form-error">{this.state.error}</div>
              <div style={{margin: '0 auto', maxWidth: '600px'}} ref={this.div} />
            </>
        )
    }
}

let shouldNavigate = event =>
    !event.defaultPrevented &&
    event.button === 0 &&
    !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
