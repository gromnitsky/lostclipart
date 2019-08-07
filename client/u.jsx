/* global Cookies, React, ReachRouter, search */

let {Link} = ReachRouter

export function my_fetch(url, opt) {
    let fetcherr = r => {
        if (r.ok) return r
        throw new Error(r.status + ' ' + r.statusText)
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

export function date_fmt(s) {
    return new Date(s*1000).toLocaleString('en-ZA', {timeZone: 'UTC'})
}

export function user_info(uid) {
    let form = new FormData()
    form.append('uid', uid)
    return fetch_json('/api/user/profile', {
	method: 'POST',
	body: new URLSearchParams(form).toString()
    })
}

export function children_find(children, fn) {
    let result
    React.Children.forEach(children, elm => {
        if (result) return
        if (fn(elm)) {
            result = elm
        } else {
            if (typeof elm.props.children === "object")
                result = children_find(elm.props.children, fn)
        }
    })
    return result
}

export function write_access(target_uid, target_status) {
    let uid = Number(Cookies.get('uid'))
    return uid === 0
        || (!target_status
            && (Cookies.get('grp') === 'admin' || target_uid === uid))
}

export function title(str, level = 1) {
    let sep = ' :: '
    let chunks = document.title.split(sep)
    document.title = [...chunks.slice(0, level) || 'Untitled', str].join(sep)
}

// from underscore.js 1.8.3
export function debounce(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
        var last = Date.now() - timestamp;

        if (last < wait && last >= 0) {
            timeout = setTimeout(later, wait - last);
        } else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            }
        }
    };

    return function() {
        context = this;
        args = arguments;
        timestamp = Date.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }

        return result;
    };
}

export function Tags(props) {
    let tags = (props.csv || '')
        .split(',').map(v => v.trim()).map( (name, idx) => {
        return <Link key={idx} to={`/search/-t%20${search.sq(name)}`}>{name}</Link>
    })
    return <span>{tags.reduce((prev, curr) => [prev, ', ', curr])}</span>
}
