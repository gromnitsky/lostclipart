function scan(string, pattern, callback) {
    var match, result;
    result = "";
    let offset = 0
    while (string.length > 0) {
        match = string.match(pattern);
        if (match) {
            result += string.slice(0, match.index);
            result += callback(match, offset);
            string = string.slice(match.index + match[0].length);

            offset += match.index + match[0].length
        } else {
            result += string;
            string = "";
        }
    }
    return result;
}

exports.split = function(line) {
    let words = []
    let field = []
    scan(line, /\s*(?:([^\s\\\'\"]+)|'((?:[^\'\\]|\\.)*)'|"((?:[^\"\\]|\\.)*)"|(\\.?)|(\S))(\s|$)?/, function(match, offset) {
        let [raw, word, sq, dq, escape, garbage, seperator] = match
        if (garbage != null) throw new Error("Unmatched quote")

        let token = value => ({
            value: value,
            begin: offset + match.index,
            end: offset + match.index + raw.length
        })

        field.push(token(word || (sq || dq || escape).replace(/\\(?=.)/, "")))
        if (seperator != null) {
            words.push(token(field))
            field = []
        }
    })
    if (field.length) words = words.concat(field)

    let util = require('util')

    return words.map( t => {    // merge subtokens
        if (Array.isArray(t.value)) {
            t.begin = t.value[0].begin
            t.value = t.value.map( st => st.value).join``
        }
        return t
    })
}
