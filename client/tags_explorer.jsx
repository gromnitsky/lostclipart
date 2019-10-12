/* global React, ReachRouter */

let {Link} = ReachRouter
import * as u from './u.js'

export default class TagsExplorer extends React.Component {
    constructor() {
        super()
        this.state = { tags: [] }
        u.title('Tags Explorer')
        this.error = u.gui_error.bind(this)
    }

    componentDidMount() {
        u.fetch_json(`/api/1/tags/all`).then( r => this.setState({tags: r}))
            .catch( e => this.error(e))
    }

    render() {
        return (
            <>
              <h1>Tags Explorer</h1>
              <div className="form-error">{this.state.error}</div>

              <input placeholder="Filter by name"
                     spellcheck="false"
                     disabled={!this.state.tags.length}
                     style={{width: '100%'}} type="search"
                     onChange={this.handle_search.bind(this)} />

              <div className="tags-explorer">
                <TagsList tags={this.state.tags} substring={this.state.substring}/>
              </div>
            </>
        )
    }

    handle_search(event) { this.setState({substring: event.target.value}) }
}

function TagsList(props) {
    return props.tags
        .filter( tag => tag.name.match((props.substring || '').toLowerCase()))
        .map( tag => (
            <div key={tag.id} className="tags-explorer--tag">
              <u.Tags csv={tag.name} /> × <span>{tag.count}</span>
            </div>
        ))
}
