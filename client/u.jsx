/* global Cookies */

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
    ['uid', 'name', 'grp', 'status', 'token', 'exp_date'].
	forEach(Cookies.remove)
}

export function session_start(token, props) {
    let opt = {
	expires: new Date(token.exp_date),
	SameSite: 'Strict'
    }
    Cookies.set('uid', token.uid, opt)
    Cookies.set('name', token.name, opt)
    Cookies.set('grp', token.grp, opt)
    Cookies.set('status', token.status, opt)
    Cookies.set('token', token.token, opt)
    Cookies.set('exp_date', token.exp_date, opt)

    props.user_set(token.name)
}

export function date_fmt(s) { return new Date(s*1000).toLocaleString('en-ZA') }

export function user_info(uid) {
    let form = new FormData()
    form.append('uid', uid)
    return fetch_json('/api/user/profile', {
	method: 'POST',
	body: new URLSearchParams(form).toString()
    })
}
