/* global React, ReactDOM, ReachRouter, Cookies */

let {Router, Link, navigate} = ReachRouter
import UserAdd from './useradd.js'
import Profile from './profile.js'
import Login from './login.js'
import Upload from './upload.js'
import ImageView from './image_view.js'
import * as u from './u.js'
import Search from './search.js'

class Main extends React.Component {
    constructor(props) {
        super(props)
        this.input = React.createRef()
        this.state = { user_name: Cookies.get('name') }
        this.handle_search = u.debounce(this.handle_search.bind(this), 500)
    }

    handle_search() {
        navigate(`/search/${this.input.current.value}`, { replace: true })
    }

    user_set(name) { this.setState({user_name: name}) }

    query_set(val) {
        if (this.input.current) {
            this.input.current.value = val
            this.input.current.focus()
        } else
            this.setState({search_query: val}) // 1st load
    }

    render() {
        return (
            <>
              <header>
                <Link to="/search/-t%20fish"><Icon name="home" /></Link>
                <Link to="upload" title="Upload an SVG">
                  <Icon name="upload" />
                </Link>
                <input id="header__search" style={{flexGrow: 1}} type="search"
                       ref={this.input}
                       placeholder="Search..."
                       defaultValue={this.state.search_query}
                       onChange={this.handle_search} />
                <HeaderProfile name={this.state.user_name} />
              </header>

              <main>
                <Router primary={false}>
                  <Upload path="upload" />
                  <UserAdd path="useradd" user_set={this.user_set.bind(this)} />
                  <Login path="login" user_set={this.user_set.bind(this)} />
                  <Logout path="logout" />
                  <Profile path="user/:uid"
                           user_set={this.user_set.bind(this)}/>
                  <ImageView path="image/:iid" />
                  <Search path="search/:query" query_set={this.query_set.bind(this)} />
                  <Search path="search" query="" query_set={this.query_set.bind(this)} />
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
              <a href={profile} title={props.name}><Icon name="user" /></a>
              <Link to="logout" title="Logout"><Icon name="signout" /></Link>
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
          <Link to="login" title="Login"><Icon name="signin" /></Link>
        </>
    )
}

let Logout = function() {
    u.session_clean()
    window.location.replace('/') // hard reload
    return null
}

function Icon(props) {
    return <svg width="16" height="16"><use href={"/vendor/bytesize-icons/dist/bytesize-inline.svg#i-" + props.name}></use></svg>
}

let app = document.querySelector('body')
ReactDOM.render(<Main />, app)
