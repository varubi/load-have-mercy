let parseMethod = defaultParse;

process.on('message', (obj) => {
    obj = JSON.parse(obj);
    switch (obj.type) {
        case 'parse':
            for (var i = 0; i < obj.content.length; i++) {
                obj.content[i] = parser(obj.content[i]);
            }
            process.send(JSON.stringify(obj));
            break;
        default:
            break;
    }
});
function parser(obj) {
    var start = Date.now();
    obj.hrefs = defaultParse(obj.href, obj.content);
    obj.parseTime = Date.now() - start;
    return obj
}

function defaultParse(href, content) {
    var hrefs = [];
    var regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1\s*(?:[^>]*?\s+)?(?:rel=(["'])(.*?)\3)?[^>]*>/g;
    var match = regex.exec(content);
    while (match != null) {
        if (!match[4])
            hrefs.push(match[2]);
        match = regex.exec(content);
    }
    return hrefs;
}