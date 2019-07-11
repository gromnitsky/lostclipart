/* global React, Cookies, ReachRouter */

let {navigate} = ReachRouter
import * as u from './u.js'

export default class Login extends React.Component {
    constructor(props) {
	super(props)
	u.session_clean()
	this.form = React.createRef()
	this.state = { error: '' }
    }

    handle_submit(event) {
	event.preventDefault()
	this.error()
	let fieldset = this.form.current.querySelector('fieldset')
	let form = new FormData(this.form.current)

	fieldset.disabled = true
	u.fetch_json('/api/user/login', {
	    method: 'POST',
	    body: new URLSearchParams(form).toString()
	}).then( token => {
	    u.session_start(token, this.props)
	    navigate('upload', { replace: true })
	}).catch( e => this.error(e)).finally( () => fieldset.disabled = false)
    }

    render() {
	return (
	    <form className="form--useradd"
		  onSubmit={this.handle_submit.bind(this)}
		  ref={this.form}>
	      <h1>Login</h1>
	      <div className="form-error">{this.state.error}</div>

	      <fieldset>
		<div>
		  <label htmlFor="form--login__name">User:</label>
		  <input name="name" id="form--login__name" />

		  <label htmlFor="form--login__pw">Password:</label>
		  <input name="password" type="password" id="form--login__pw" />

		  <div className="form--useradd__btn">
		    <input type="submit" />
		  </div>
		</div>
	      </fieldset>
	    </form>
	)
    }

    error(err) {
	if (err instanceof Error) err = err.message
	this.setState({error: err ? `Error: ${err}`: ''})
    }
}
