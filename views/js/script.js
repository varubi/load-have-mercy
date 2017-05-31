
app.incoming.on('client.done', function (event, message) {
    console.log('crawl complete!');
    var x = app.outgoing.view();
    var results = views.results(x);
    document.getElementById('results').innerHTML = results;
    document.getElementById('overlay').classList.remove('on')
});

app.incoming.on('client.kmod', function (event, message) {
    document.getElementById('overlay').innerHTML = '<span>' + message + '</span>';
});

app.incoming.on('client.parseStart', function (event, obj) {
    var start = Date.now();
    var href = obj.href;
    var content = obj.content;
    var regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1\s*(?:[^>]*?\s+)?(?:rel=(["'])(.*?)\3)?[^>]*>/g;
    var match = regex.exec(content);
    var hrefs = [];
    while (match != null) {
        if (!match[4])
            hrefs.push(match[2]);
        match = regex.exec(content);
    }
    obj.hrefs = hrefs;
    obj.parseTime = Date.now() - start;
    
    app.outgoing.parseComplete(obj);
});

function run() {
    document.getElementById('overlay').classList.add('on')
    var base_url = document.getElementById('base_url').value;
    var url_limit = document.getElementById('url_limit').value;
    var url_passes = document.getElementById('url_passes').value;
    var request_maxpersecond = document.getElementById('request_maxpersecond').value;
    var request_limit = document.getElementById('request_limit').value;

    app.outgoing.crawl({
        base_url: base_url,
        url_limit: url_limit,
        url_passes: url_passes,
        request_maxpersecond: request_maxpersecond,
        request_limit: request_limit
    })
}
function buildResults() {

}