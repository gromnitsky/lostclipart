/* global React */

import * as u from './u.js'

export class LicenseSelector extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}
        this.node = React.createRef()
    }

    componentDidMount() { this.fetch_licenses() }
    componentDidUpdate() {      // dom is ready
        let node = this.node.current
        let idx = Array.from(node.options).
            findIndex( v => v.value === (this.props.lid || "3")) // CC BY
        if (idx) node.selectedIndex = idx
    }

    async fetch_licenses() {
	this.setState({
	    licenses: (await u.fetch_json('/api/1/licenses'))
		.map( v => <option key={v.lid} value={v.lid}>{v.name}</option>)
	})
    }

    render() {
	return (
	    <select name="lid" id="image__license-sel" ref={this.node}>
	      {this.state.licenses}
	    </select>
	)
    }
}

export function tags_completions(user_input) {
    return u.fetch_json(`/api/1/tags/search?q=${encodeURIComponent(user_input)}`).
        then( r => r.map( v => v.name))
}
