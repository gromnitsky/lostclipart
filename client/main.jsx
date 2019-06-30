/* global React, ReactDOM, ReachRouter */

let {Router, Link} = ReachRouter
import UserAdd from './useradd.js'

export default class Main extends React.Component {
    constructor(props) {
	super(props)
    }
    render() {
	return (
	    <>
	      <header>
		<Link to="/">Home</Link>
		<Link to="upload">Upload</Link>
		<input id="header__search" style={{flexGrow: 1}}
		       placeholder="Search..."/>
		<Link to="useradd">Register</Link> {/* or user name */}
		<Link to="login">Login</Link>      {/* or Logout */}
	      </header>

	      <Router>
		<Home path="/" />
		<Upload path="upload" />
		<UserAdd path="useradd" />
		<Login path="login" />
	      </Router>

	      <footer>
		<hr />
		Footer
	      </footer>
	    </>
	)
    }
}

let Home = () => <h1>Home</h1>
let Upload = () => <h1>Upload</h1>
let Login = () => <h1>Login</h1>

let app = document.querySelector('body')
ReactDOM.render(<Main />, app)
