/* global React, ReachRouter, search */

let {Link, navigate} = ReachRouter
import * as u from './u.js'

export default class Upload extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}
        u.title(`Search :: ${this.props.search_query}`)
    }

    render() {
        return 'hello ' + JSON.stringify(search.query_parse(this.props.search_query))
    }
}
