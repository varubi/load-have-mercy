var path = require('path'),
    $Q = (q) => document.querySelector(q),
    $QA = (q) => document.querySelectorAll(q),
    $AddEvent = (e, t, fn) => { e.addEventListener(t, fn.bind(e)) },
    requestsmade = 0,
    results = [],
    webv;

app.incoming.on('client.done', function (event, message) {
    results = app.outgoing.view();
    var t = (Date.now() - $Q('[stat="Time"]').startTime);
    $QA('.postresult').forEach((element) => {
        element.classList.remove('postresult')
    });

    $Q('[stat="Time"]').innerHTML = t >= 3000000 ? Math.ceil(t / 60000) + ' m' : Math.ceil(t / 1000) + ' s';
    $Q('[stat="Total"]').innerHTML = results.length;
    $Q('#results').innerHTML = views.results(results);
    showPane('results');
    infograph.sunburst.initialize();
});

app.incoming.on('client.kmod', function (event, message) {
    infograph.bandwidth.update(message.bandwidth);
    console.log(message)
    $Q('#kms-response-wrapper .bandwidth').val += message.bandwidth;
    $Q('#kms-response-wrapper .average').val += message.responses.ttfb.length ? message.responses.ttfb.reduce((accumulator, currentValue) => accumulator + currentValue) : 0;


    $Q('#kms-response-wrapper .total').innerHTML = '<b>Total</b>' + message.requests.total;
    $Q('#kms-response-wrapper .average').innerHTML = '<b>Average</b>' + Math.round($Q('#kms-response-wrapper .average').val / message.requests.total);
    $Q('#kms-response-wrapper .bandwidth').innerHTML = '<b>Bandwidth</b>' + views.bytesize($Q('#kms-response-wrapper .bandwidth').val);


    $Q('#kms-requests .active').innerHTML = '<b>Active</b>' + message.requests.active;
    $Q('#kms-requests .closed').innerHTML = '<b>Closed</b>' + message.requests.closed;
    $Q('#kms-requests .opened').innerHTML = '<b>Opened</b>' + message.requests.opened;
    var avg = 0;
    if (message.responses.ttfb.length) {
        for (var i = 0; i < message.responses.ttfb.length; i++) {
            avg += message.responses.ttfb[i];
        }
        avg /= message.responses.ttfb.length;
        avg = parseInt(avg);
    }
    $Q('#response-times').chart.update(avg);
    $Q('#kms-requests-charts .active').chart.update(message.requests.active);
    $Q('#kms-requests-charts .closed').chart.update(message.requests.closed);
    $Q('#kms-requests-charts .opened').chart.update(message.requests.opened);
    document.getElementById('overlay').innerHTML = '<span>' + views.bytesize(message.bandwidth) + '/s</span>';
    // '<span>' + message.requests.total + '</span>';
});

document.addEventListener('DOMContentLoaded', function () {
    webv = $Q('#webview');
    webv.addEventListener('did-navigate', () => {
        var url = webv.getURL();
        $Q('#urlbar').placeholder = '';
        $Q('#urlbar').classList.remove('error');
        if (url.indexOf('file') == 0) {
            url = path.normalize(webv.getURL()).replace('file:\\', '')
            if (url.indexOf(__dirname) == 0) {
                url = url
                    .replace(__dirname + '\\', '').replace('.html', '')
                $Q('#urlbar').placeholder = url;
                url = '';
            } else {
                url = 'file:////' + url;
            }
        }
        $Q('#urlbar').value = url;
        nav_buttons();
    })
    webv.addEventListener('did-start-loading', () => {
        $Q('#nav_action').setAttribute('data-action', 'stop');
    })
    webv.addEventListener('did-stop-loading', () => {
        $Q('#nav_action').setAttribute('data-action', 'reload');
    })
    webv.addEventListener('did-fail-load', (e) => {
        if (!e.errorDescription)
            return;
        $Q('#urlbar').classList.add('error');
        $Q('#webview-error').innerHTML = e.errorDescription;
        console.log(webv.getURL())
        console.log(e)
        nav_buttons();
    })
    $Q('#urlbar').addEventListener('keydown', (e) => {
        if (e.keyCode == 13) {
            $Q('#urlbar').blur();
            load();
        }
    });
    $Q('#nav_action').addEventListener('click', () => {
        if ($Q("#nav_action").getAttribute('data-action') == 'reload')
            webv.reload();
        else
            webv.stop();
    })
    $QA('[data-pane]').forEach((el) => {
        $AddEvent(el, 'click', (e) => { showPane(el.getAttribute('data-pane')); })
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
    $Q("#results").addEventListener("click", function (e) {
        if (e.target && e.target.matches("a")) {
            showPane('browser');
            webv.loadURL(e.target.getAttribute('href'))
            e.preventDefault();

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
function copyText(element) {
    window.getSelection().selectAllChildren(element);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
}

function run() {
    showPane('pre-results');
    infograph.bandwidth.initialize();
    $Q('#config').classList.remove('active');
    $Q('[stat="Time"]').startTime = Date.now();
    $Q('#kms-response-wrapper .total').innerHTML = '';
    $Q('#kms-response-wrapper .average').innerHTML = '';
    $Q('#kms-response-wrapper .bandwidth').innerHTML = '';

    $Q('#kms-response-wrapper .average').val = 0;
    $Q('#kms-response-wrapper .bandwidth').val = 0;

    $Q('#kms-requests-charts .opened').innerHTML = '';
    $Q('#kms-requests-charts .opened').chart = new infograph.line('#kms-requests-charts .opened');
    $Q('#kms-requests-charts .active').innerHTML = '';
    $Q('#kms-requests-charts .active').chart = new infograph.line('#kms-requests-charts .active');
    $Q('#kms-requests-charts .closed').innerHTML = '';
    $Q('#kms-requests-charts .closed').chart = new infograph.line('#kms-requests-charts .closed');
    $Q('#response-times').innerHTML = '';
    $Q('#response-times').chart = new infograph.line('#response-times');

    var p = $Q('#protocols');
    requestsmade = 0;
    var protocols = p.options[p.selectedIndex].value;
    app.outgoing.crawl({
        base_url: webv.getURL(),
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

    $Q('#webview-error').innerHTML = '';
    switch ($Q('#urlbar').value) {
        case 'home':
            webv.loadURL('file:\\' + __dirname + '/home.html');
            break;
        default:
            if (!/^[A-Za-z\d]+:\/\//.test($Q('#urlbar').value)) {
                $Q('#urlbar').value = 'http://' + $Q('#urlbar').value;
            }
            webv.loadURL($Q('#urlbar').value);
            break;
    }
    showPane('browser');
}
function showPane(target) {
    if ($Q('#' + target) && $Q('#' + target).classList.contains('fullpane'))
        $QA('.fullpane').forEach((el) => {
            el.classList.toggle('active', !!(el.id == target));
        });
    $QA('.halfpane').forEach((el) => {
        el.classList.toggle('active', !!(el.id == target));
    });
}
