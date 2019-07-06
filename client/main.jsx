/* global React, ReactDOM, ReachRouter, Cookies */

let {Router, Link, navigate} = ReachRouter
import UserAdd from './useradd.js'
import Profile from './profile.js'
import Login from './login.js'
import Upload from './upload.js'
import * as u from './u.js'

class Main extends React.Component {
    constructor(props) {
	super(props)
	this.state = {
	    user_name: Cookies.get('name')
	}
    }

    user_set(name) { this.setState({user_name: name}) }

    render() {
	return (
	    <>
	      <header>
		<Link to="/">Home</Link>
		<Link to="upload">Upload</Link>
		<input id="header__search" style={{flexGrow: 1}}
		       placeholder="Search..."/>
		<HeaderProfile name={this.state.user_name} />
	      </header>

	      <main>
		<Router>
		  <Home path="/" />
		  <Upload path="upload" />
		  <UserAdd path="useradd" user_set={this.user_set.bind(this)} />
		  <Login path="login" user_set={this.user_set.bind(this)} />
		  <Logout path="logout" />
		  <Profile path="user/:uid"
			   user_set={this.user_set.bind(this)}/>
		</Router>
	      </main>

	      <footer>
		<ul>
		  <li>&copy; 2019 AG</li>
		  <li><a href="/terms.txt">Terms</a></li>
		  <li><a href="/privacy.txt">Privacy</a></li>
		</ul>
	      </footer>
	    </>
	)
    }
}

let HeaderProfile = function(props) {
    if (props.name) {
	let profile = `/user/${Cookies.get('uid')}`
	return (
	    <>
	      <a href={profile}>{props.name}</a>
	      <Link to="logout">Logout</Link>
	    </>
	)
    }
    return (
	<>
	  <Link to="useradd">Register</Link>
	  <Link to="login">Login</Link>
	</>
    )
}

let Logout = function() {
    u.session_clean()
    window.location.href = '/'	// hard reload
    return null
}

let Home = () => <h1>Home</h1>

let app = document.querySelector('body')
ReactDOM.render(<Main />, app)
