/* global Cookies, ReachRouter */

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

export function session_clean() {
    ['uid', 'name', 'token', 'exp_date'].forEach(Cookies.remove)
}

export function session_start(token, form, props) {
    let opt = {
	expires: new Date(token.exp_date),
	SameSite: 'Strict'
    }
    Cookies.set('uid', token.uid, opt)
    Cookies.set('name', form.get('name'), opt)
    Cookies.set('token', token.token, opt)
    Cookies.set('exp_date', token.exp_date, opt)

    props.user_set(form.get('name'))
}
