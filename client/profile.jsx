/* global React, Cookies, ReachRouter */

let {navigate} = ReachRouter
import * as u from './u.js'

export default class Profile extends React.Component {
    constructor(props) {
	super(props)
	this.form_general = React.createRef()
	this.form_pw = React.createRef()

	this.error_general = e => this.flash_error('error_general', e)
	this.error_pw = e => this.flash_error('error_pw', e)

	this.state = {
	    error_general: '',
	    error_pw: '',
	}

	this.get_user_info()
    }

    render() {
	return (
	    <>
	      <form className="form--useradd"
		    onSubmit={this.handle_submit_general.bind(this)}
		    ref={this.form_general}>
		<h1>Profile</h1>
		<div className="form-error">{this.state.error_general}</div>
		<fieldset>
		  <div>
		    <label>Name</label>
		    <input name="name" value={this.state.name}
			   onChange={this.handle_name_change.bind(this)} />

		    <label>Group</label>
		    <span className="form--pw__roval">{this.state.grp}</span>

		    <label>Uploaded</label>
		    <a className="form--pw__roval" href="#">TODO</a>

		    <label>Gecos</label>
		    <textarea value={this.state.gecos}
			      onChange={this.handle_gecos_change.bind(this)}
			      name="gecos" style={{height: '4rem'}} />

		    <div className="form--useradd__btn">
		      <input type="submit" />
		    </div>
		  </div>
		</fieldset>
	      </form>

	      <form className="form--useradd"
		    onSubmit={this.handle_submit_pw.bind(this)}
		    ref={this.form_pw}>
		<h1>Change Password</h1>
		<div className="form-error">{this.state.error_pw}</div>
		<fieldset>
		  <div>
		    <label htmlFor="form--pw__1">New password:</label>
		    <input name="password1" type="password" id="form--pw__1" />
		    <label htmlFor="form--pw__2">Repeat new password:</label>
		    <input name="password2" type="password" id="form--pw__2" />

		    <div className="form--useradd__btn">
		      <input type="submit" />
		    </div>

		  </div>
		</fieldset>
	      </form>
	    </>
	)
    }

    handle_submit_general(event) {
	event.preventDefault()
	this.error_general('')
	let fieldset = this.form_general.current.querySelector('fieldset')

	let form = new FormData(this.form_general.current)
	form.append('uid', this.uid())

	fieldset.disabled = true
	u.fetch_text('/api/user/edit/misc', {
	    method: 'POST', body: new URLSearchParams(form).toString()
	}).catch( e => this.error_general(e))
	    .finally( () => fieldset.disabled = false)
    }

    handle_gecos_change(evt) { this.setState({gecos: evt.target.value}) }
    handle_name_change(evt) { this.setState({name: evt.target.value}) }

    handle_submit_pw(event) {
	event.preventDefault()
	this.error_pw('')
	let fieldset = this.form_pw.current.querySelector('fieldset')

	let form = new FormData(this.form_pw.current)
	if (form.get('password1') !== form.get('password2')) {
	    this.error_pw("passwords don't match"); return
	}
	form.set('uid', this.uid())
	form.set('password', form.get('password1'))
	form.delete('password1')
	form.delete('password2')

	fieldset.disabled = true
	u.fetch_text('/api/user/edit/password', {
	    method: 'POST', body: new URLSearchParams(form).toString()
	}).then( () => {
	    navigate('/login')
	}).catch( e => this.error_pw(e))
	    .finally( () => fieldset.disabled = false)
    }

    get_user_info() {
	let form = new FormData()
	form.append('uid', this.uid())
	u.fetch_json('/api/user/profile', {
	    method: 'POST',
	    body: new URLSearchParams(form).toString()
	}).then( json => {
	    this.setState(json)
	}).catch(e => console.log(`${this.get_user_info.name}:`, e))
    }

    uid() {
	let p = window.location.href.split('/')
	return p[p.length - 1] || -1
    }

    flash_error(form, err) {
	if (err instanceof Error) err = err.message
	this.setState({[form]: err ? `Error: ${err}`: ''})
    }
}
