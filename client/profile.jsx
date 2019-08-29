/* global React, Cookies, ReachRouter, search */

let {Link, navigate} = ReachRouter
import * as u from './u.js'

export default function Profile(props) {
    u.title('Profile')
    return (
        <>
          <UserEdit {...props} />
          <UserEditPassword {...props} />
        </>
    )
}

class UserEdit extends React.Component {
    constructor() {
        super()
        this.state = {}
        this.form = React.createRef()
        this.error = u.gui_error.bind(this)
    }

    componentDidMount() {
        u.user_info(this.props.uid).then( json => {
            this.setState(json)
            u.title(json.name, 2)
        }).catch( e => this.error(e))
    }

    render() {
        return (
            <form className="form--useradd" ref={this.form}
                  onSubmit={this.handle_submit.bind(this)} >
              <h1>Profile</h1>
              <div className="form-error">{this.state.error}</div>

              <fieldset>
                <div>
                  <label htmlFor="form--useradd__name">Name:</label>
                  <input name="name" value={this.state.name}
                         id="form--useradd__name"
                         onChange={this.input_handle.bind(this)} />

                  <label>Group:</label>
                  <span>{this.state.grp}</span>

                  <label>Registered:</label>
                  <span>{u.date_fmt(this.state.registered)}</span>

                  <label>Uploads:</label>
                  {this.state.uid ? <Link to={`/search/-r%20-u%20${search.sq(this.state.uid)}`}>{this.state.uploads}</Link> : <span />}

                  <label>Status:</label>
                  <span>{this.status()}</span>

                  <label htmlFor="form--useradd__gecos">Gecos:</label>
                  <textarea value={this.state.gecos}
                            id="form--useradd__gecos"
                            onChange={this.input_handle.bind(this)}
                            name="gecos" style={{height: '4rem'}} />

                  <div className="form--useradd__btn">
                    <input type="submit" />
                  </div>

                </div>
              </fieldset>
            </form>
        )
    }

    input_handle(event) {
        this.setState({[event.target.name]: event.target.value})
    }

    status() {
        if (this.state.error) return null
        return this.state.status ? this.state.status : 'nominal'
    }

    handle_submit(event) {
        event.preventDefault()
        this.error('')
        let fieldset = this.form.current.querySelector('fieldset')

        let form = new FormData(this.form.current)
        form.append('uid', this.props.uid)

        fieldset.disabled = true
        u.fetch_text('/api/1/user/edit/misc', {
            method: 'POST', body: new URLSearchParams(form).toString()
        }).then( () => {        // upd user name in GUI
            Cookies.set('name', form.get('name'))
            this.props.user_set(form.get('name'))
        }).catch( e => this.error(e)).finally( () => fieldset.disabled = false)
    }
}

class UserEditPassword extends React.Component {
    constructor() {
        super()
        this.state = {}
        this.form = React.createRef()
        this.error = u.gui_error.bind(this)
    }

    render() {
        return (
            <form className="form--useradd" ref={this.form}
                  onSubmit={this.handle_submit.bind(this)} >
              <h1>Change Password</h1>
              <div className="form-error">{this.state.error}</div>
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
        )
    }

    handle_submit(event) {
        event.preventDefault()
        this.error('')
        let fieldset = this.form.current.querySelector('fieldset')

        let form = new FormData(this.form.current)
        if (form.get('password1') !== form.get('password2')) {
            this.error("passwords don't match"); return
        }
        form.set('uid', this.props.uid)
        form.set('password', form.get('password1'))
        form.delete('password1')
        form.delete('password2')

        fieldset.disabled = true
        u.fetch_text('/api/1/user/edit/password', {
            method: 'POST', body: new URLSearchParams(form).toString()
        }).then( () => {
            navigate('/login')
        }).catch( e => this.error(e)).finally( () => fieldset.disabled = false)
    }
}
