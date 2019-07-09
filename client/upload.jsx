/* global React, Cookies, ReachRouter */

let {navigate} = ReachRouter
import * as u from './u.js'
import * as ic from './image_common.js'

export default class Login extends React.Component {
    constructor(props) {
	super(props)
	this.form = React.createRef()
	this.state = {}
    }

    render() {
	if (!Cookies.get('uid')) {
	    navigate('/login', { replace: true }); return null
	}
	return (
	    <form className="form--image"
		  onSubmit={this.handle_submit.bind(this)}
		  ref={this.form}>
	      <h1>Upload</h1>

	      <fieldset>
		<div>
		  <div className="form--image__ctrl">
		    <input type="file" name="svg"
			   id="form--image__file"
			   onChange={this.handle_image.bind(this)}
			   accept=".svg, .SVG" />

		    <canvas style={{marginTop: '5px'}}
			    width="320" height="320"
			    id="form--image__preview"></canvas>
		  </div>

		  <label htmlFor="image__license-sel">License:</label>
		  <ic.LicenseSelector />

		  <label htmlFor="form--image__tags">Tags:</label>
		  <ic.Tagger id="form--image__tags" name="tags"
			     placeholder="foo bar, baz" />

		  <label htmlFor="form--upload__desc">Description:</label>
		  <textarea id="form--image__desc"
			    name="desc" style={{height: '4rem'}} />

		  <div className="form--image__btn">
		    <input type="submit" />
		  </div>

		</div>
	      </fieldset>

	      <div className="form-error">{this.state.error}</div>
	    </form>
	)
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

    canvas() { return this.form.current.querySelector('#form--image__preview')}
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
		// FIXME: navigate to /image/:iid
	    }).catch( e => this.error(e))
		.finally( () => fieldset.disabled = false)
	})
    }

    error(err) {
	if (err instanceof Error) err = err.message
	this.setState({error: err ? `Error: ${err}`: ''})
    }
}
