/* global React, ReactDOM, ReachRouter, Cookies */

let {Router, Link, navigate} = ReachRouter
import UserAdd from './useradd.js'
import Profile from './profile.js'
import Login from './login.js'
import Upload from './upload.js'
import ImageView from './image_view.js'
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
                <Link to="/">
                  <svg id="i-home" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                    <path d="M12 20 L12 30 4 30 4 12 16 2 28 12 28 30 20 30 20 20 Z" />
                  </svg>
                </Link>
                <Link to="upload" title="Upload an SVG">
                  <svg id="i-upload" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                    <path d="M9 22 C0 23 1 12 9 13 6 2 23 2 22 10 32 7 32 23 23 22 M11 18 L16 14 21 18 M16 14 L16 29" />
                  </svg>
                </Link>
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
		  <ImageView path="image/:iid" />
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
              <a href={profile} title={props.name}>
                <svg id="i-user" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                  <path d="M22 11 C22 16 19 20 16 20 13 20 10 16 10 11 10 6 12 3 16 3 20 3 22 6 22 11 Z M4 30 L28 30 C28 21 22 20 16 20 10 20 4 21 4 30 Z" />
                </svg>
              </a>
              <Link to="logout" title="Logout">
                <svg id="i-signout" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                  <path d="M28 16 L8 16 M20 8 L28 16 20 24 M11 28 L3 28 3 4 11 4" />
                </svg>
              </Link>
            </>
        )
    }
    return (
        <>
          <Link to="useradd" title="Register">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </Link>
          <Link to="login" title="Login">
            <svg id="i-signin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <path d="M3 16 L23 16 M15 8 L23 16 15 24 M21 4 L29 4 29 28 21 28" />
            </svg>
          </Link>
        </>
    )
}

let Logout = function() {
    u.session_clean()
    window.location.replace('/') // hard reload
    return null
}

let Home = function() {
    u.title('Home')
    return <h1>Home</h1>
}

let app = document.querySelector('body')
ReactDOM.render(<Main />, app)
