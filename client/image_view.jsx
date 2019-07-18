/* global React, ReachRouter */

let {Link, navigate} = ReachRouter
import * as u from './u.js'
import * as ic from './image_common.js'

export default class Upload extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}
        u.title('loading image...')
    }

    componentDidMount() {
	u.fetch_json(`/api/image/view?iid=${this.iid()}`).then( json => {
	    let r = Object.assign({}, json[0])
	    r.tags = json.map( v => v.tag).join`, `
	    this.setState(r)
            u.title(r.iid)
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
		<div id="image--viewer">
		  <a id="image--viewer__img"
		     href={this.img().svg} target="_blank"
		     rel="noopener noreferrer">
		    <img src={this.state.iid && this.img().thumbnail} />
		  </a>

                  <span>Title</span>
                  <WR_input model={this.state.title}
                           iid={this.iid()}
                           name="title"
                           is_writable={this.writable.bind(this)}
                           error={this.error_saving.bind(this)}>
                    <>
                      <span className="wrinput__readable"></span>
                      <input className="wrinput__writable" />
                    </>
                  </WR_input>

                  <span>Uploader</span>
                  <Link to={"/user/" + this.state.uid}>{this.state.user_name}</Link>

                  <span>License:</span>
                  <WR_license model={this.state.lid}
                              iid={this.iid()}
                              name="lid"
                              is_writable={this.writable.bind(this)}
                              error={this.error_saving.bind(this)}>
                    <>
                      <span className="wrinput__readable"></span>
                      <div className="wrinput__writable">
                        <ic.LicenseSelector />
                      </div>
                    </>
                  </WR_license>

                  <span>Original filename</span>
                  <WR_input model={this.state.filename}
                           iid={this.iid()}
                           name="filename"
                           is_writable={this.writable.bind(this)}
                           error={this.error_saving.bind(this)}>
                    <>
                      <span className="wrinput__readable"></span>
                      <input className="wrinput__writable" />
                    </>
                  </WR_input>

                  <span>mtime</span>
                  <WR_mtime model={this.state.mtime}
                            iid={this.iid()}
                            name="mtime"
                            is_writable={this.writable.bind(this)}
                            error={this.error_saving.bind(this)}>
                    <>
                      <span className="wrinput__readable"></span>
                      <input type="datetime-local"
                             className="wrinput__writable" />
                    </>
                  </WR_mtime>

		  <span>Size</span>
		  <span>{this.state.size} bytes</span>

		  <span>Tags</span>
                  <WR_tags model={this.state.tags}
                            iid={this.iid()}
                            name="tags"
                            is_writable={this.writable.bind(this)}
                            error={this.error_saving.bind(this)}>
                    <>
                      <span className="wrinput__readable"></span>
                      <div className="wrinput__writable">
                        <ic.Tagger id="image--viewer__tagger" />
                      </div>
                    </>
                  </WR_tags>

		  <span>Uploaded</span>
		  <div>{u.date_fmt(this.state.uploaded)}</div>

		  <span>Write access</span>
		  <div>{this.writable() ? 'yes' : 'no'}</div>

		  <span>Description</span>
                  <WR_input model={this.state.desc}
                            iid={this.iid()}
                            name="desc"
                            is_writable={this.writable.bind(this)}
                            error={this.error_saving.bind(this)}>
                    <>
                      <pre className="wrinput__readable" />
                      <textarea style={{height: '4rem'}}
                                className="wrinput__writable"/>
                    </>
                  </WR_input>

                  <button className={this.writable() ? '' : 'hidden'}
                          onClick={this.handle_delete.bind(this)}
                          id="image--viewer__delete">Delete</button>

		</div>
	      </div>
	    </>
	)
    }

    writable() {
        return u.write_access(this.state.uid, this.state.user_status)
    }

    error_saving(err) {
        this.setState({error_saving: err instanceof Error ? err.message : err})
    }

    iid() {
        let p = window.location.pathname.split('/')
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

    handle_delete() {
        if (!confirm("Are you sure?")) return
        let form = new FormData()
        form.set('iid', this.iid())
        u.my_fetch('/api/image/edit/rm', {
            method: 'POST',
            body: new URLSearchParams(form).toString()
        }).then( () => {
            navigate('/', { replace: true })
        }).catch( e => {
            this.error_saving(e)
        })
    }
}

class WR_input extends React.Component {
    constructor(props) {
        super(props)
        this.state = { mode: 'readable' }
//        this.state = { mode: 'writable' }
        this.node = React.createRef()
    }

    // sets this.state.model when it gets a props update
    static getDerivedStateFromProps(props, state) {
        if (state.model === undefined && props.model !== undefined)
            return {model: props.model}
        return null
    }

    render() {
        return <div ref={this.node}>{this[`${this.state.mode}_render`]()}</div>
    }

    // dom is ready
    componentDidUpdate() { this[`${this.state.mode}_dom_upd`]() }

    readable_dom_upd() {
        this.readable_node().innerText = this.readable_value_get()
    }

    readable_render() {
        return (
            <div className="wrinput"
                 style={{
                     display: 'flex',
                     overflow: "auto",
                     wordBreak: "break-word"
                 }}>
              {this.readable_children()}
              <button className={this.props.is_writable() ? '' : 'hidden'}
                      style={{ marginLeft: "5px" }}
                      onClick={this.readable_handle_click.bind(this)}>E</button>
            </div>
        )
    }

    readable_node() { return this.node.current.querySelector(`.wrinput__readable`) }
    readable_children() { return this.children('wrinput__readable') }
    readable_value_get() { return this.state.model }
    readable_value_set() { /* do nothing */ }

    readable_handle_click() {
        this.readable_value_set()
        this.setState({mode: 'writable'})
    }


    writable_render() {
        return (
            <div className="wrinput" style={{ display: 'flex' }}>
              {this.writable_children()}
              <button style={{ marginLeft: "5px" }}
                      onClick={this.writable_handle_click.bind(this)}>S</button>
            </div>
        )
    }

    writable_dom_upd() {
        this.writable_node().value = this.writable_value_get()
    }

    writable_node() { return this.node.current.querySelector(`.wrinput__writable`) }
    writable_children() { return this.children('wrinput__writable') }
    writable_value_get() { return this.state.model }
    writable_value_set() {
        let new_val = this.writable_node().value
        this.setState({model: new_val})
        return new_val
    }

    writable_handle_click() {
        let new_val = this.writable_value_set() // for setState isn't immediate
        this.props.error('')

        let form = new FormData()
        form.set('iid', this.props.iid)
        form.set(this.props.name, new_val)
        u.my_fetch('/api/image/edit/misc', {
            method: 'POST',
            body: new URLSearchParams(form).toString()
        }).then( () => {
            this.setState({mode: 'readable'})
        }).catch( e => {
            this.props.error(e)
        })
    }


    children(class_name) {
        let kids = React.cloneElement(this.props.children)
        return u.children_find(kids, e => e.props.className === class_name)
    }
}

// model is seconds from epoch
class WR_mtime extends WR_input {
    readable_value_get() {      // human-readable
        let d = new Date(0); d.setUTCMilliseconds((this.state.model || 0)*1000)
        return d.toISOString()
    }

    writable_value_get() { // suitable for <input type="datetime-local">
        let d = new Date(0); d.setUTCMilliseconds((this.state.model || 0)*1000)
        return d.toISOString().replace(/Z$/, '')
    }

    writable_value_set() { // back to seconds
        let new_val = Math.floor(new Date((this.writable_node().value || 0) + 'Z').getTime() / 1000)
        this.setState({model: new_val})
        return new_val
    }
}

class WR_tags extends WR_input {
    writable_node() {           // awesomeplete
        return this.node.current.querySelector('.wrinput__writable input')
    }
}

class WR_license extends WR_input {
    componentDidMount() { this.fetch_licenses() }

    fetch_licenses() {
        u.fetch_json('/api/licenses').then( licenses => this.setState({ licenses }))
    }

    writable_children() {
        let children = super.writable_children()
        let ls = u.children_find(children, e => e.type === ic.LicenseSelector)
        ls.props.lid = String(this.state.model)
        return children
    }

    readable_value_get() {      // human-readable
        if ( !(this.state.licenses && this.state.model)) return
        return this.state.licenses
            .find( v => v.lid === Number(this.state.model)).name
    }

    writable_node() {
        return this.node.current.querySelector('.wrinput__writable select')
    }
}
