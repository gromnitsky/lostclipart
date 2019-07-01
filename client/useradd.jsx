/* global React, Cookies, ReachRouter */

let {navigate} = ReachRouter

export default class UserAdd extends React.Component {
    constructor(props) {
	super(props)
	this.handle_submit = this.handle_submit.bind(this)
	this.form = React.createRef()
	this.state = {
	    error: ''
	}
    }

    error(err) {
	if (err instanceof Error) err = err.message
	this.setState({error: err ? `Error: ${err}`: ''})
    }

    handle_submit(event) {
	event.preventDefault()
	this.error()
	let fieldset = this.form.current.querySelector('fieldset')

	let form = new FormData(this.form.current)
	if (form.get('password1') !== form.get('password2')) {
	    this.error("passwords don't match"); return
	}
	form.append('password', form.get('password1'))
	form.delete('password1')
	form.delete('password2')

	fieldset.disabled = true
	fetch_json('/api/user/new', {
	    method: 'POST',
	    body: new URLSearchParams(form).toString()
	}).then( token => {	// auto login
	    console.log(token)
	    let opt = {
		expires: new Date(token.exp_date),
		SameSite: 'Strict'
	    }
	    Cookies.set('uid', token.uid, opt)
	    Cookies.set('name', form.get('name'), opt)
	    Cookies.set('token', token.token, opt)
	    Cookies.set('exp_date', token.exp_date, opt)

	    this.props.user_set(form.get('name'))
	    navigate(`user/${token.uid}`, { replace: true })
	}).catch( e => this.error(e)).finally( () => fieldset.disabled = false)
    }

    render() {
	return (
	    <form id="form--useradd"
		  onSubmit={this.handle_submit} ref={this.form}>
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

		  <div id="form--useradd__captcha">
		    TODO: captcha
		  </div>

		  <div id="form--useradd__btn">
		    <input type="submit" />
		  </div>
	      </div></fieldset>

	      <p>
		By clicking 'Submit', you agree to our Terms of Service
		and Privacy Statement.
	      </p>
	    </form>
	)
    }
}

function fetch_json(url, opt) {
    let fetcherr = r => {
	if (r.ok) return r
	throw new Error(r.status + ' ' + r.statusText) // FIXME: read res body
    }
    return fetch(url, opt).then(fetcherr).then( r => r.json())
}
