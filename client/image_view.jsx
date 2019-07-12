/* global React, ReachRouter, Cookies */

let {Link} = ReachRouter
import * as u from './u.js'
import * as ic from './image_common.js'

export default class Upload extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}

	u.fetch_json(`/api/image/view?iid=${this.iid()}`).then( json => {
	    let r = Object.assign({}, json[0])
	    r.tags = json.map( v => v.tag).join`, `
	    this.setState(r)
	}).catch( e => {
	    this.setState({error_loading: e.message})
	})
    }

    render() {
	return (
	    <>
	      <div className="form-error">{this.state.error_loading}</div>
	      <div className="form-error">{this.state.error_saving}</div>

	      <div className={this.state.error_loading ? 'hidden' : ''}>
		<h1>{this.state.title}</h1>
		<div id="image--viewer">
		  <a id="image--viewer__img"
		     href={this.img().svg} target="_blank"
		     rel="noopener noreferrer">
		    <img src={this.state.iid && this.img().thumbnail} />
		  </a>

		  <span>Uploader</span>
		  <span>
		    <Link to={"/user/" + this.state.uid}>{this.state.user_name}</Link>
		  </span>

		  <span>License:</span>
		  <span>{this.state.license}</span>

		  <span>Original filename</span>
                  <EInput value={this.state.filename}
                          name="filename"
                          uid={this.state.uid}
                          status={this.state.user_status}
                          hook_to="#image--viwer__filename"
                          error={this.error_saving.bind(this)}>
                    <input id="image--viwer__filename" />
                  </EInput>

		  <span>mtime</span>
                  <EInput value={new Date((this.state.mtime || 0)*1000).toISOString().replace(/Z$/, '')}
                          name="mtime"
                          uid={this.state.uid}
                          status={this.state.user_status}
                          hook_to="#image--viwer__mtime"
                          error={this.error_saving.bind(this)}>
                    <input type="datetime-local" id="image--viwer__mtime" />
                  </EInput>

		  <span>Size</span>
		  <span>{this.state.size} bytes</span>

		  <span>Tags</span>
                  <EInput value={this.state.tags}
                          name="tags"
                          uid={this.state.uid}
                          status={this.state.user_status}
                          hook_to="#image--viewer__tagger"
                          error={this.error_saving.bind(this)}>
                    <div>
                      <ic.Tagger id="image--viewer__tagger" />
                    </div>
                  </EInput>

		  <span>Uploaded</span>
		  <div>{u.date_fmt(this.state.uploaded)}</div>

		  <span>Write access</span>
		  <div>{u.write_access(this.state.uid, this.state.user_status) ? 'yes' : 'no'}</div>

		  <span>Description</span>
                  <EInput value={this.state.desc}
                          name="desc"
                          uid={this.state.uid}
                          status={this.state.user_status}
                          hook_to="#image--viwer__desc"
                          error={this.error_saving.bind(this)}>
                    <textarea style={{height: '4rem'}} id="image--viwer__desc"/>
                  </EInput>

		</div>
	      </div>
	    </>
	)
    }

    error_saving(msg) { this.setState({error_saving: msg}) }

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

class EInput extends React.Component  {
    constructor(props) {
        super(props)
        this.state = { writable: false }
    }

    // static getDerivedStateFromProps(props, state) {
    //     console.log(1)
    //     return { value: props.value }
    // }

    UNSAFE_componentWillReceiveProps(props) {
        this.setState({value: props.value})
    }

    render() {
        return this.state.writable ? this.rnd_writable() : this.rnd_readable()
    }

    componentDidUpdate() {
        if (!this.state.writable) return
        let input = document.querySelector(this.props.hook_to)
        input.value = this.state.value
    }

    rnd_writable() {
        let children = React.cloneElement(this.props.children)
        children.props.style = children.props.style || {}
        Object.assign(children.props.style, { flexGrow: 1 })

        return (
            <div className="editable--input" style={{display: 'flex'}}>
              {children}
              <button style={{ marginLeft: "5px" }}
                      onClick={this.handle_click_save.bind(this)}>S</button>
            </div>
        )
    }

    handle_click_save() {
        let value = document.querySelector(this.props.hook_to).value
        // FIXME
        this.setState({value, writable: false})
    }

    rnd_readable() {
        return (
            <div className="editable--input"
                 style={{
                     display: 'flex',
                     overflow: "auto",
                     wordBreak: "break-word"
                 }}>
              <span style={{flexGrow: 1}}>{this.state.value}</span>
              <button className={u.write_access(this.props.uid, this.props.user_status) ? '' : 'hidden'}
                      style={{ marginLeft: "5px" }}
                      onClick={this.handle_click_edit.bind(this)}>E</button>
            </div>
        )
    }

    handle_click_edit() { this.setState({writable: true}) }
}
