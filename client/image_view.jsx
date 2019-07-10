/* global React, Cookies, ReachRouter */

let {Link, navigate} = ReachRouter
import * as u from './u.js'
import * as ic from './image_common.js'

export default class Upload extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}

	u.fetch_json(`/api/image/view?iid=${this.iid()}`).then( json => {
	    this.setState({image: json})
	}).catch( e => {
	    this.setState({error: e.message})
	})
    }

    render() {
	return (
	    <>
	      <div className="form-error">{this.state.error}</div>

	      <div className={this.state.error ? 'hidden' : ''}>
		<h1>{this.img().title}</h1>
		<div id="image--viewer">
		  <a id="image--viewer__img"
		     href={iid2image(this.img().uid, this.img().iid).svg}>
		    <img src={this.state.image &&
			 iid2image(this.img().uid, this.img().iid).thumbnail} />
		  </a>

		  <span>Uploader:</span>
		  <span>
		    <Link to={"/user/" + this.img().uid}>{this.img().user_name}</Link>

		  </span>

		  <span>License:</span>
		  <span>{this.img().license}</span>

		  <span>Original filename:</span>
		  <code>{this.img().filename}</code>

		  <span>mtime:</span>
		  <span>{u.date_fmt(this.img().mtime)}</span>

		  <span>Size:</span>
		  <span>{this.img().size} bytes</span>

		  <span>Description:</span>
		  <div>{this.img().desc}</div>

		  <span>Tags:</span>
		  <div>{this.tags()}</div>
		</div>
	      </div>
	    </>
	)
    }

    img() {
	return this.state.image ? this.state.image[0] : {}
    }

    tags() {
	if (!this.state.image) return
	return this.state.image.map( v => v.tag).join`, `
    }

    iid() {
	let p = window.location.href.split('/')
	return p[p.length - 1] || -1
    }
}

function iid2image(uid, iid) {
    let dir = '/clipart'
    return {
	svg: [dir, 'images', uid, `${iid}.svg`].join('/'),
	thumbnail: [dir, 'thumbnails', uid, `${iid}.png`].join('/')
    }
}
