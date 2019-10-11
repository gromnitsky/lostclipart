/* global React */

import * as u from './u.js'
import * as ic from './image_common.js'

export default function TagsUtils() {
    let [error, setError] = React.useState()
    let [progress, setProgress] = React.useState()
    let form = React.createRef()

    let gui_error2 = function(err) {
        if (err instanceof Error) {
            // X-Error is generated by server.js
            err = err.headers ? err.headers.get('X-Error') : err.toString()
        } else {
            if (err) err = `Error: ${err}`
        }
        setError(err || '')
    }

    let handle_submit = event => {
        event.preventDefault()
        gui_error2()
        setProgress(true)

        u.my_fetch('/api/1/tags/edit/utils', {
            method: 'POST',
            body: new URLSearchParams(new FormData(form.current)).toString()
        }).catch(gui_error2).finally( () => setProgress(false))
    }

    return (
        <form className="form--useradd tags-utils"
              onSubmit={handle_submit}
              ref={form}>
          <h1>Rename, Delete, Split or Merge</h1>
          <div className="form-error">{error}</div>

          <table>
            <thead><tr><th>src</th><th>dest</th><th>meaning</th></tr></thead>
            <tbody>
              <tr>
                <td>foo</td>
                <td>bar</td>
                <td>rename</td>
              </tr>
              <tr>
                <td>foo</td>
                <td></td>
                <td>delete</td>
              </tr>
              <tr>
                <td>foo</td>
                <td>bar, baz</td>
                <td>split</td>
              </tr>
              <tr>
                <td>bar, baz</td>
                <td>foo</td>
                <td>merge</td>
              </tr>
            </tbody>
          </table>

          <fieldset style={{marginTop: '1em'}} disabled={progress}>
            <div>
              Source:
              <AwesompleteTagger placeholder="old" name="src"
                                 completions={ic.tags_completions} />

              Destination:
              <AwesompleteTagger placeholder="new" name="dest"
                                 completions={ic.tags_completions} />

              <div className="form--useradd__btn">
                <input type="submit" />
              </div>

            </div>
          </fieldset>
        </form>
    )
}
