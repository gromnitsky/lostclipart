/* global React */
import * as u from './u.js'

export default class Status extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
        u.title('Status')
        this.error = u.gui_error.bind(this)
    }

    componentDidMount() {
        u.fetch_json(`/api/1/headers`).then(console.log)
        u.fetch_json(`/api/status`).then( r => this.setState(r)).
            catch( e => this.error(e))
    }

    render() {
        return (
            <div style={{maxWidth: '400px', margin: '0 auto'}}>
              <h1>Status</h1>
              <div className="form-error">{this.state.error}</div>

              <div style={{display: this.state.error ? 'none' : 'grid',
                   gridTemplateColumns: 'auto 1fr', gridGap: '5px'}}>
                <label>Users:</label>
                <span>{this.state.users}</span>

                <label>Images:</label>
                <span>{this.state.images}</span>

                <label>Tags:</label>
                <span>{this.state.tags}</span>

                <label>Last upload:</label>
                <span>{u.date_fmt(this.state.last_upload)}</span>
              </div>
            </div>
        )
    }
}
