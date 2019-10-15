/* global React, ReachRouter */

let {navigate} = ReachRouter
import * as u from './u.js'

export default class UserAdd extends React.Component {
    constructor(props) {
        super(props)
        this.form = React.createRef()
        this.state = {}
        u.title('Register')
        this.error = u.gui_error.bind(this)
    }

    handle_submit(event) {
	event.preventDefault()
        this.error('')
	let fieldset = this.form.current.querySelector('fieldset')

	let form = new FormData(this.form.current)
	if (form.get('password1') !== form.get('password2')) {
	    this.error("passwords don't match"); return
	}
	form.append('password', form.get('password1'))
	form.delete('password1')
	form.delete('password2')

	fieldset.disabled = true
	u.fetch_json('/api/1/user/new', {
	    method: 'POST',
	    body: new URLSearchParams(form).toString()
	}).then( token => {	// auto login
	    console.log(token)
	    u.session_start(token, this.props)
	    navigate('upload', { replace: true })
	}).catch( e => this.error(e)).finally( () => fieldset.disabled = false)
    }

    render() {
	return (
	    <form className="form--useradd"
		  onSubmit={this.handle_submit.bind(this)}
		  ref={this.form}>
	      <h1>Register</h1>
	      <div className="form-error">{this.state.error}</div>

	      <fieldset>
		<div> {/* for css grid doesn't work in fieldset! */}
		  <label htmlFor="form--useradd__name">New user name:</label>
		  <input name="name" id="form--useradd__name" />

		  <label htmlFor="form--useradd__pw1">Password:</label>
		  <input name="password1" type="password" id="form--useradd__pw1" />

		  <label htmlFor="form--useradd__pw2">Repeat password:</label>
		  <input name="password2" type="password" id="form--useradd__pw2" />

		  <div className="form--useradd__btn">
		    <input type="submit" />
		  </div>
	      </div></fieldset>

	      <p>
		By clicking &apos;Submit&apos;, you agree to our
                Terms of Service & Privacy Statement.
	      </p>
	    </form>
	)
    }
}
