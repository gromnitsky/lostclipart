/* global Cookies */

export default function gdpr(msg = `
This site uses cookies to offer you a better browsing experience.

Press OK to accept.`) {
    let name = 'eu_cookie_consent'
    if (Cookies.get(name) === '1') return

    if (confirm(msg)) {
        Cookies.set(name, 1, {expires: new Date(2147483647*1000), SameSite: 'Strict'})
    } else {
        window.location.href = 'https://ec.europa.eu/commission/priorities/justice-and-fundamental-rights/data-protection/2018-reform-eu-data-protection-rules_en'
    }
}
