/* global React, ReachRouter */

let {Link} = ReachRouter
import * as u from './u.js'

export default class Upload extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}

	u.fetch_json(`/api/image/view?iid=${this.iid()}`).then( json => {
	    let r = Object.assign({}, json[0])
	    r.tags = json.map( v => v.tag).join`, `
	    this.setState(r)
	}).catch( e => {
	    this.setState({error: e.message})
	})
    }

    render() {
	return (
	    <>
	      <div className="form-error">{this.state.error}</div>

	      <div className={this.state.error ? 'hidden' : ''}>
		<h1>{this.state.title}</h1>
		<div id="image--viewer">
		  <a id="image--viewer__img"
		     href={this.img().svg} target="_blank"
		     rel="noopener noreferrer">
		    <img src={this.state.iid && this.img().thumbnail} />
		  </a>

		  <span>Uploader:</span>
		  <span>
		    <Link to={"/user/" + this.state.uid}>{this.state.user_name}</Link>
		  </span>

		  <span>License:</span>
		  <span>{this.state.license}</span>

		  <span>Original filename:</span>
		  <code>{this.state.filename}</code>

		  <span>mtime:</span>
		  <span>{u.date_fmt(this.state.mtime)}</span>

		  <span>Size:</span>
		  <span>{this.state.size} bytes</span>

		  <span>Tags:</span>
		  <div>{this.state.tags}</div>

		  <span>Description:</span>
		  <div>{this.state.desc}</div>

		</div>
	      </div>
	    </>
	)
    }

    iid() {
	let p = window.location.href.split('/')
	return p[p.length - 1] || -1
    }

    img() {
	let dir = '/clipart'
	return {
	    svg: [dir, 'images', this.state.uid,
		  `${this.state.iid}.svg`].join('/'),
	    thumbnail: [dir, 'thumbnails', this.state.uid,
			`${this.state.iid}.png`].join('/')
	}
    }
}
