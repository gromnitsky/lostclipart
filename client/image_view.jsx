/* global React, ReachRouter */

let {Link} = ReachRouter
import * as u from './u.js'
import * as ic from './image_common.js'

export default class Upload extends React.Component {
    constructor(props) {
	super(props)
	this.state = {}
    }

    componentDidMount() {
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
                  <ELicenseSelector value={this.state.license}
                                    iid={this.iid()}
                                    name="lid"
                                    uid={this.state.uid}
                                    status={this.state.user_status}
                                    hook_to="#image__license-sel"
                                    error={this.error_saving.bind(this)}>
                    <div>
                      <ic.LicenseSelector />
                    </div>
                  </ELicenseSelector>

		  <span>Original filename</span>
                  <EInput value={this.state.filename}
                          iid={this.iid()}
                          name="filename"
                          uid={this.state.uid}
                          status={this.state.user_status}
                          hook_to="#image--viwer__filename"
                          error={this.error_saving.bind(this)}>
                    <input id="image--viwer__filename" />
                  </EInput>

		  <span>mtime</span>
                  <EInput value={new Date((this.state.mtime || 0)*1000).toISOString().replace(/Z$/, '')}
                          iid={this.iid()}
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
                          iid={this.iid()}
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
                          iid={this.iid()}
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
}

class EInput extends React.Component  {
    constructor(props) {
        super(props)
        this.state = { writable: false }
    }

    // sets this.state.value when it gets a props update
    static getDerivedStateFromProps(props, state) {
        if (state.value === undefined && props.value !== undefined)
            return {value: props.value}
        return null
    }

    render() {
        return this.state.writable ? this.rnd_writable() : this.rnd_readable()
    }

    componentDidUpdate() {
        if (!this.state.writable) return
        let input = document.querySelector(this.props.hook_to)
        input.value = this.state.value
    }

    writable_children_get() {
        let children = React.cloneElement(this.props.children)
        children.props.style = children.props.style || {}
        Object.assign(children.props.style, { flexGrow: 1 })
        return children
    }

    rnd_writable() {
        return (
            <div className="editable--input" style={{display: 'flex'}}>
              {this.writable_children_get()}
              <button style={{ marginLeft: "5px" }}
                      onClick={this.handle_click_save.bind(this)}>S</button>
            </div>
        )
    }

    writable_value_get() {      // overridable
        return document.querySelector(this.props.hook_to).value
    }

    value_for_saving() {
        return this.writable_value_get() // overridable
    }

    handle_click_save() {
        let value = this.writable_value_get()
        this.props.error('')

        let form = new FormData()
        form.set('iid', this.props.iid)
        form.set(this.props.name, this.value_for_saving())
        u.my_fetch('/api/image/edit', {
            method: 'POST',
            body: new URLSearchParams(form).toString()
        }).then( () => {
            this.setState({value, writable: false})
        }).catch( e => {
            this.props.error(e)
        })
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

class ELicenseSelector extends EInput {
    writable_children_get() {
        let children = super.writable_children_get()
        let ls = u.children_find(children, elm => {
            return elm.type === ic.LicenseSelector
        })
        ls.props.text = this.state.value
        return children
    }

    writable_value_get() {
        let node = document.querySelector(this.props.hook_to)
        return node.options[node.selectedIndex].text
    }

    value_for_saving() {
        let node = document.querySelector(this.props.hook_to)
        let idx = Array.from(node.options).
            findIndex( v => v.text === this.writable_value_get())
        return node.options[idx].value
    }
}
