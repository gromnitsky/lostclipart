/* global React, Cookies, ReachRouter, AwesompleteTagger */

let {navigate} = ReachRouter
import * as u from './u.js'
import * as ic from './image_common.js'

export default class Upload extends React.Component {
    constructor(props) {
        super(props)
        this.form = React.createRef()
        this.state = {}
        u.title('Upload')
        this.error = u.gui_error.bind(this)
    }

    render() {
        return (
            <form className="form--image" ref={this.form}
                  onSubmit={this.handle_submit.bind(this)} >
              <h1>Upload</h1>

              <fieldset>
                <div className="image--viewer">
                  <div style={{display: 'flex', flexDirection: 'column', marginRight: '5px'}}>
                    <input type="file" name="svg" id="form--image__file"
                           onChange={this.handle_image.bind(this)}
                           accept=".svg, .SVG" />
                    <canvas style={{marginTop: '5px'}} width="320" height="320"
                            id="form--image__preview" />
                  </div>

                  <div className="image--viewer__controls">
                    <label htmlFor="form--image__title">Title:</label>
                    <input name="title" id="form--image__title" />

                    <label htmlFor="image__license-sel">License:</label>
                    <ic.LicenseSelector />

                    <label htmlFor="form--image__tags">Tags:</label>
                    <AwesompleteTagger id="form--image__tags" name="tags"
                                       placeholder="foo bar, baz"
                                       completions={ic.tags_completions} />

                    <label htmlFor="form--image__desc">Description:</label>
                    <textarea id="form--image__desc"
                              name="desc" style={{height: '4rem'}} />

                    <div className="form--useradd__btn">
                      <input type="submit" />
                    </div>

                    <div className="form-error" style={{gridColumn: '1 / -1'}}>
                      {this.state.error}
                    </div>
                  </div>

                </div>
              </fieldset>

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
            this.error('')
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
	    u.fetch_json('/api/1/image/upload', {
		method: 'POST',
		body: form
	    }).then( json => {
		navigate(`image/${json.iid}`)
            }).catch( e => {
                // redirect to the already uploaded by someone else image
                let m = e.headers.get('X-Error').match(/SqliteError: ([0-9]+)$/)
                if (m) navigate(`/image/${m[1]}`)
                this.error(e)
            }).finally( () => fieldset.disabled = false)
        })
    }
}
