/* global React, Cookies, ReachRouter, Awesomplete */

let {navigate} = ReachRouter
import * as u from './u.js'

export default class Login extends React.Component {
    constructor(props) {
	super(props)
	this.form = React.createRef()
	this.state = { error: '' }

	this.licenses()
    }

    render() {
	if (!Cookies.get('uid')) {
	    navigate('/login', { replace: true }); return null
	}
	return (
	    <form id="form--upload"
		  onSubmit={this.handle_submit.bind(this)}
		  ref={this.form}>
	      <h1>Upload</h1>

	      <fieldset>
		<div>
		  <div id="form--upload__ctrl">
		    <input type="file" name="svg"
			   id="form--upload__file"
			   onChange={this.handle_image.bind(this)}
			   accept=".svg, .SVG" />

		    <canvas style={{marginTop: '5px'}}
			    width="320" height="320"
			    id="form--upload__preview"></canvas>
		  </div>

		  <label htmlFor="form--upload__license">License:</label>
		  <select name="lid" id="form--upload__license">
		    {this.state.licenses}
		  </select>

		  <label htmlFor="form--upload__tags">Tags:</label>
		  <Tagger id="form--upload__tags" name="tags"
			  placeholder="foo bar, baz" />

		  <label htmlFor="form--upload__desc">Description:</label>
		  <textarea id="form--upload__desc"
			    name="desc" style={{height: '4rem'}} />

		  <div id="form--upload__btn"><input type="submit" /></div>

		</div>
	      </fieldset>

	      <div className="form-error">{this.state.error}</div>
	    </form>
	)
    }

    async licenses() {
	this.setState({
	    licenses: (await u.fetch_json('/api/licenses'))
		.map( v => <option key={v.lid} selected={v.name === "CC BY"}
		      value={v.lid}>{v.name}</option>)
	})
    }

    handle_image() {
	let ctx = this.canvas().getContext("2d")
	ctx.clearRect(0, 0, this.canvas().width, this.canvas().height)

	if (!this.svg()) return
	console.log(this.svg())

	let img = new Image()
	img.src = URL.createObjectURL(this.svg())
	img.onload = () => {
	    let [width, height] = [img.width, img.height]

	    // scale to the target width
	    let target_width = 320
	    let sX1 = target_width
	    let sY1 = (height * target_width) / width

	    // s to the target height
	    let target_height = 320
	    let sX2 = (width * target_height) / height
	    let sY2 = target_height

	    // select which s to use
	    ;[width, height] = sY1 > sX2 ? [sX2, sY2] : [sX1, sY1]
	    ctx.drawImage(img, 0,0, width, height)
	}
    }

    canvas() { return this.form.current.querySelector('#form--upload__preview')}
    svg() { return this.form.current.querySelector('input[type=file]').files[0]}

    handle_submit(event) {
	event.preventDefault()
	if (!this.svg()) { this.error('no svg selected'); return }
	this.error()

	this.canvas().toBlob( blob => {
	    let fieldset = this.form.current.querySelector('fieldset')
	    let form = new FormData(this.form.current)
	    form.set('mtime', Math.floor(this.svg().lastModified/1000))
	    form.set('thumbnail', blob,
		     this.svg().name.replace(/\.\w+$/, '.png'))

	    fieldset.disabled = true // FIXME: draw a progress bar
	    u.fetch_json('/api/image/upload', {
		method: 'POST',
		body: form
	    }).then( iid => {
		console.log(iid)
		// FIXME: navigate to /image/:iid/edit
	    }).catch( e => this.error(e))
		.finally( () => fieldset.disabled = false)
	})
    }

    error(err) {
	if (err instanceof Error) err = err.message
	this.setState({error: err ? `Error: ${err}`: ''})
    }
}

class Tagger extends React.Component {
    constructor(props) {
	super(props)
	this.ctrl = React.createRef()
    }

    render() {
	return (
	    <input id={this.props.id} name={this.props.name}
		   placeholder={this.props.placeholder} spellCheck="false"
		   ref={this.ctrl} />
	)
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
