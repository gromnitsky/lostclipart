/* global React, Cookies */

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

	let form = new FormData(document.querySelector('form'))
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
	    // FIXME: redirect to a profile page
	}).catch( e => this.error(e)).finally( () => fieldset.disabled = false)
    }

    render() {
	return (
	    <form id="form--useradd"
		  onSubmit={this.handle_submit} ref={this.form}>
	      <div id="error">{this.state.error}</div>

	      <fieldset>
		<label>New user name: <input name="name" /></label>
		<label>Password:
		  <input name="password1" type="password" />
		</label>
		<label>Repeat password:
		  <input name="password2" type="password" />
		</label>

		<div>
		  TODO: captcha
		</div>

		<input type="submit" />
	      </fieldset>
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
