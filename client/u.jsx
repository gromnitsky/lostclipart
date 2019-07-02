export function my_fetch(url, opt) {
    let fetcherr = r => {
	if (r.ok) return r
	throw new Error(r.status + ' ' + r.statusText) // FIXME: read res body
    }
    return fetch(url, opt).then(fetcherr)
}

export function fetch_json(url, opt) {
    return my_fetch(url, opt).then( r => r.json())
}

export function fetch_text(url, opt) {
    return my_fetch(url, opt).then( r => r.text())
}
