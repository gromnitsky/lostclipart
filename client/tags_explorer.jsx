/* global React, ReachRouter */

let {Link} = ReachRouter
import * as u from './u.js'

export default class TagsExplorer extends React.Component {
    constructor() {
        super()
        this.state = { tags: [], sort: 'count' }
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

              <div style={{display: 'flex'}}>
                <input placeholder="Filter by name" style={{flexGrow: 1}}
                       spellCheck="false" type="search"
                       disabled={!this.state.tags.length}
                       onChange={this.handle_search.bind(this)} />
                <input type="checkbox" name="sort" id="tags-explorer__sort"
                       checked={this.state.sort === 'name'}
                       onChange={this.handle_sort.bind(this)}/>
                <label htmlFor="tags-explorer__sort">Name sort</label>
              </div>

              <div className="tags-explorer">
                <TagsList {...this.state} />
              </div>
            </>
        )
    }

    handle_search(event) { this.setState({substring: event.target.value}) }
    handle_sort(event) { this.setState({sort: event.target.checked ? 'name' : 'count'}) }
}

function TagsList(props) {
    return props.tags
        .filter( tag => tag.name.match((props.substring || '').toLowerCase()))
        .sort( (a, b) => {
            return props.sort === 'name' ? a.name.localeCompare(b.name) : b.count - a.count
        })
        .map( tag => (
            <div key={tag.id} className="tags-explorer--tag">
              <u.Tags csv={tag.name} /> × <span>{tag.count}</span>
            </div>
        ))
}
