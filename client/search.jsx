/* global React, ReachRouter, search */

let {Link, navigate} = ReachRouter
import * as u from './u.js'

export default class Upload extends React.Component {
    constructor(props) {
        super(props)
        this.state = { images: [] }
        u.title(`Search :: ${this.props.search_query}`)
        this.componentDidUpdate({})
    }

    componentDidUpdate(prev_props) {
        if (prev_props.search_query === this.props.search_query) return

        try {
            search.query_parse(this.props.search_query)
        } catch (e) {
            this.setState({
                error: e.message,
                images: [],
                progress: null,
            })
            return
        }

        this.setState({
            error: null,
            images: [],
            progress: 'Fetching...'
        })
        u.fetch_json('/api/search?q='
                     +encodeURIComponent(this.props.search_query))
            .then( images => {
                this.setState({images})
            }).catch( e => {
                this.setState({ error: e.message })
            }).finally( () => {
                this.setState({progress: null})
            })
    }

    render() {
        let images = this.images()
        return (
            <>
              <div className="form-error">{this.state.error}</div>
              <div>{this.state.progress}</div>
              <div>
                {!images.length && !this.state.error ? 'No match' : images}
              </div>
            </>
        )
    }

    images() {
        return this.state.images.map( (image, idx) => {
            return (
                <div key={idx} className="image--preview">
                  <div>{image.title}</div>
                  <div>{image.tags}</div>
                </div>
            )
        })
    }
}
