/* global React, Awesomplete */

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
	    licenses: (await u.fetch_json('/api/licenses'))
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

export class Tagger extends React.Component {
    constructor(props) {
	super(props)
	this.ctrl = React.createRef()
    }

    render() {
	return <input {...this.props} ref={this.ctrl} />
    }

    componentDidMount() {
	let ctrl = this.ctrl.current

	let last_tag = s => s.match(/[^,]*$/)[0]
	let awsmplt = new Awesomplete(ctrl, {
	    filter: function(text, input) {
		return Awesomplete.FILTER_CONTAINS(text, last_tag(input))
	    },
	    item: function(text, input) {
		return Awesomplete.ITEM(text, last_tag(input))
	    },
	    replace: function(text) {
		let before = this.input.value.match(/^.+,\s*|/)[0]
		this.input.value = before + text + ", "
	    }
	})

	ctrl.addEventListener('input', evt => { // TODO: debounce
	    let q = last_tag(evt.target.value).trim(); if (q.length < 2) return
	    u.fetch_json(`/api/tags/search?q=${encodeURIComponent(q)}`)
		.then( tags => {
		    awsmplt.list = tags.map( v => v.name)
		    awsmplt.evaluate()
		})
	})
    }
}
