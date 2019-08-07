/* global React, ReachRouter, search */

let {Link, navigate} = ReachRouter
import * as u from './u.js'

export default class Search extends React.Component {
    constructor(props) {
        super(props)
        this.state = { images: [] }
    }

    componentDidMount() { this.fetch({}) }
    componentDidUpdate(prev_props) { this.fetch(prev_props) }

    fetch(prev_props) {
        if (prev_props.query === this.props.query) return
        let query = this.props.query || ''

        u.title(`Search :: ${query}`)
        if (this.props.query_set) this.props.query_set(query)

        let query_parsed
        try {
            query_parsed = search.query_parse(query)
        } catch (e) {
            this.setState({
                error: e.message,
                images: [],
                progress: null,
                query: {},
            })
            return
        }

        this.setState({
            error: null,
            images: [],
            progress: 'Fetching...',
            query: query_parsed,
        })
        u.fetch_json('/api/search?q='+encodeURIComponent(query))
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
              <div className="images">
                {!images.length && !this.state.error ? 'No match' : images}
              </div>

              {this.next_link()}
            </>
        )
    }

    next_link() {
        let img = this.state.images[this.state.images.length-1]
        if (!img) return null
        let new_query = Object.assign({}, this.state.query, {
            last_uploaded: img.uploaded,
            last_iid: img.iid,
        })
        return <Link to={`/search/${search.querify(new_query)}`}>Next</Link>
    }

    images() {
        return this.state.images.map( (image, idx) => {
            return (
                <div key={idx} className="image--preview">
                  <div>{image.title} <small>({image.iid})</small></div>
                  <Link to={`/image/${image.iid}`} style={{flexGrow: 1}} >
                    <img src={search.iid2image(image.uid, image.iid, '/clipart').thumbnail} />
                  </Link>
                  <u.Tags csv={image.tags} />
                  <div>
                    {this.uploaded(image.uploaded)},{" "}
                    <Link to={`/search/-l%20${search.sq(image.license)}`}>{image.license}</Link>
                    {" "}by{" "}
                    <Link to={`/search/-u%20${search.sq(image.uid)}`}>{image.user_name}</Link>
                  </div>
                </div>
            )
        })
    }

    uploaded(epoch) {
        let d = new Date(epoch * 1000)
        return [d.getFullYear(), d.getMonth()+1, d.getDate()].join`-`
    }
}
