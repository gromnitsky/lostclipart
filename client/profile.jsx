/* global React, Cookies */

export default class Profile extends React.Component {
    constructor(props) {
	super(props)
	this.form_general = React.createRef()
	this.form_pw = React.createRef()
	this.state = {
	    error: '',
	    user_name: '?'
	}
    }

    render() {
	return (
	    <>
	      <form ref={this.form_general}>
		<div className="error">{this.state.error}</div>
		<fieldset>
		  <table style={{width: '100%'}}>
		    <tbody>
		      <tr>
			<td>User</td>
			<td><input value={this.state.user_name} /></td>
		      </tr>
		      <tr><td>Group</td><td>?</td></tr>
		      <tr>
			<td>Uploaded</td>
			<td><button>?</button></td>
		      </tr>
		      <tr>
			<td>Gecos</td>
			<td>
			  <textarea style={{width: '100%', height: '4rem'}}>?</textarea>
			</td>
		      </tr>
		    </tbody>
		  </table>

		  <input type="submit" />
		</fieldset>
	      </form>

	      <form id="form--password" ref={this.form_pw}>
		<div className="error">{this.state.error}</div>
		<fieldset>
		  <label>Old password:
		    <input name="password_old" type="password" />
		  </label>
		  <label>New password:
		    <input name="password_new1" type="password" />
		  </label>
		  <label>Repeat new password:
		    <input name="password_new2" type="password" />
		  </label>

		  <input type="submit" />
		</fieldset>
	      </form>
	    </>
	)
    }
}
