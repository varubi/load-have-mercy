
var $Q = (q) => document.querySelector(q),
    $QA = (q) => document.querySelectorAll(q),
    requestsmade = 0;

app.incoming.on('client.done', function (event, message) {
    var results = app.outgoing.view();
    var t = (Date.now() - $Q('[stat="Time"]').startTime);
    $QA('.postresult').forEach((element) => {
        element.classList.remove('postresult')
    });

    $Q('[stat="Time"]').innerHTML = t >= 3000000 ? Math.ceil(t / 60000) + ' m' : Math.ceil(t / 1000) + ' s';
    $Q('[stat="Total"]').innerHTML = results.length;
    $Q('#results').innerHTML = views.results(results);
    $Q('#overlay').classList.remove('active')
    drawchart();
    showFullPane('results');

});

app.incoming.on('client.kmod', function (event, message) {
    document.getElementById('overlay').innerHTML = '<span>' + message + '</span>';
});

window.addEventListener('resize', function () { drawchart(); });
document.addEventListener('DOMContentLoaded', function () {
    google.charts.load('current', { 'packages': ['scatter'] });
    var webv = $Q('#webview');
    webv.addEventListener('did-navigate', () => {
        $Q('#urlbar').value = webv.getURL();
        $Q('#urlbar').classList.remove('error');
        nav_buttons();
    })
    webv.addEventListener('did-fail-load', () => {
        $Q('#urlbar').classList.add('error');
        nav_buttons();
    })
    $Q('#urlbar').addEventListener('keydown', (e) => {
        if (e.keyCode == 13) {
            $Q('#urlbar').blur();
            load();
        }
    });
    $Q('#btn_browser').addEventListener('click', (e) => {
        showFullPane('browser');
    })
    $Q('#btn_config').addEventListener('click', (e) => {
        showHalfPane('config')
    })
    $Q('#btn_result').addEventListener('click', (e) => {
        showFullPane('results')
    })
    $Q('#nav_backward').addEventListener('click', (e) => {
        if (webv.canGoBack()) {
            webv.goBack();
        } else {
            $Q('#nav_backward').classList.add('disabled');
        }
    });
    $Q('#nav_forward').addEventListener('click', (e) => {
        if (webv.canGoForward()) {
            webv.goForward();
        } else {
            $Q('#nav_forward').classList.add('disabled');
        }
    });

    $Q('#chrome-minimize').addEventListener('click', function (e) {
        var window = app.remote.getCurrentWindow();
        window.minimize();
    });

    $Q('#chrome-maximize').addEventListener('click', function (e) {
        var window = app.remote.getCurrentWindow();
        if (!window.isMaximized()) {
            window.maximize();
        } else {
            window.unmaximize();
        }
    });

    $Q('#chrome-close').addEventListener('click', function (e) {
        var window = app.remote.getCurrentWindow();
        window.close();
    });
    function nav_buttons() {
        $Q('#nav_backward').classList.toggle('disabled', !webv.canGoBack());
        $Q('#nav_forward').classList.toggle('disabled', !webv.canGoForward());
    }
})


function run() {
    showFullPane()
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
    $Q('#webview').loadURL($Q('#urlbar').value);
    showFullPane('browser');


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
function showFullPane(target) {
    $QA('.fullpane').forEach((el) => {
        el.classList.toggle('active', !!(el.id == target));
    });
    showHalfPane();
}
function showHalfPane(target) {
    $QA('.halfpane').forEach((el) => {
        el.classList.toggle('active', !!(el.id == target));
    });
}