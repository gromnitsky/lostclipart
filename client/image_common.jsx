/* global Cookies, React, Awesomplete */

import * as u from './u.js'

export class LicenseSelector extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}
    }

    componentDidMount() { this.fetch_licenses() }

    async fetch_licenses() {
	this.setState({
	    licenses: (await u.fetch_json('/api/licenses'))
		.map( v => <option key={v.lid}
		      selected={v.name === (this.props.value || "CC BY")}
		      value={v.lid}>{v.name}</option>)
	})
    }

    render() {
	return (
	    <select name="lid" id="image__license-sel">
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
