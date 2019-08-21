/* global React, ReachRouter, Cookies */

let {Link} = ReachRouter

export default class GDPR extends React.Component {
    constructor() {
        super()
        this.key = 'eu_cookie_consent'
        this.state = { hidden: Cookies.get(this.key) === '1' }
    }

    render() {
        if (this.state.hidden) return null
        return (
            <div className="gdpr-warning">
              <h2>Cookies</h2>

              <p>
                This site uses cookies to offer you a better browsing
                experience. Find out more on <Link to="/doc/cookies">
                  how we use cookies</Link>.
              </p>

              <button onClick={this.handle_consent.bind(this)}>
                I accept cookies
              </button>
            </div>
        )
    }

    handle_consent() {
        Cookies.set(this.key, 1, {
            expires: new Date('2038-01-10'),
            SameSite: 'Strict'
        })
        this.setState({hidden: true})
    }
}
