
var $Q = (q) => document.querySelector(q),
    $QA = (q) => document.querySelectorAll(q)
    , requestsmade = 0;

app.incoming.on('client.done', function (event, message) {
    var results = app.outgoing.view();
    var t = (Date.now() - $Q('[stat="Time"]').startTime);
    $Q('[stat="Time"]').innerHTML = t >= 3000000 ? Math.ceil(t / 60000) + ' m' : Math.ceil(t / 1000) + ' s';
    $Q('[stat="Total"]').innerHTML = results.length;
    $Q('#results').innerHTML = views.results(results);
    $Q('#overlay').classList.remove('active')
    drawchart();
});

app.incoming.on('client.kmod', function (event, message) {
    document.getElementById('overlay').innerHTML = '<span>' + message + '</span>';
});

window.addEventListener('resize', function () { drawchart(); });
document.addEventListener('DOMContentLoaded', function () {
    google.charts.load('current', { 'packages': ['scatter'] });
    $Q('#webview').addEventListener('did-navigate', () => {
        $Q('#urlbar').value = $Q('#webview').getURL();
        $Q('#urlbar').classList.remove('error');
        $Q('#browser').setAttribute('active', 'webview');
    })
    $Q('#webview').addEventListener('did-fail-load', () => {
        $Q('#urlbar').classList.add('error');
        $Q('#browser').setAttribute('active', 'browserinfo');
    })
})


function run() {
    $Q('#browser').classList.remove('active')
    $Q('#config').classList.remove('active');
    $Q('#overlay').classList.add('active');
    $Q('#overlay').innerHTML = '<span>0</span>';
    $Q('[stat="Time"]').startTime = Date.now();

    var p = $Q('#protocols');
    requestsmade = 0;
    var protocols = p.options[p.selectedIndex].value;
    app.outgoing.crawl({
        base_url: $Q('#urlbar').value,
        url_limit: $Q('#url_limit').value * 1,
        url_passes: 1,
        request_maxpersecond: $Q('#request_maxpersecond').value * 1,
        request_limit: $Q('#request_limit').value * 1,
        external: $Q('#domains_external').checked,
        followSubdomain: $Q('#domains_sub').checked,
        caseSensitive: $Q('#case_sensitive').checked,
        protocols: protocols
    })
}
function load() {
    if (!/^[A-Za-z\d]+:\/\//.test($Q('#urlbar').value)) {
        $Q('#urlbar').value = 'http://' + $Q('#urlbar').value;
    }
    $Q('#browser').classList.add('active')
    $Q('#webview').loadURL($Q('#urlbar').value);

}
function drawchart() {
    if (!views.chartData || views.chartData.length > 1000)
        return;
    var graph = new google.visualization.DataTable();
    graph.addColumn('number', 'Start Time');
    graph.addColumn('number', 'TTFB');
    graph.addColumn({ type: 'string', role: 'tooltip' });
    graph.addRows(views.chartData);
    var options = {
        chart: {
            title: 'Request  TTFB',
            subtitle: 'Timeline'
        },
        hAxis: { title: 'Start Time (unix)' },
        vAxis: { title: 'TTFB (ms)' },
        tooltip: { trigger: 'selection' }
    };

    var chart = new google.charts.Scatter($Q('#graphs'));
    chart.draw(graph, google.charts.Scatter.convertOptions(options));
}