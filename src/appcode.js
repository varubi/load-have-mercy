const http = require('http'),
    https = require('https'),
    path = require('path'),
    url = require('url'),
    model = require('./model.js'),
    events = require('events');

function Client() { }
Client.prototype = new events.EventEmitter;
Client.prototype.crawl = function (baseurl) {
    this.protocol = 'http:';
    this.host = 'example.com';
    this.pathname = '';
    this.external = false;
    this.followSubdomain = true;
    this.caseSensitive = false;


    this.url_limit = 1000;
    this.url_passes = 0;

    this.request_headers = {
        "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36'
    };
    this.request_maxpersecond = 50;
    this.request_open = 0;
    this.request_limit = 50;
    this.request_last = Date.now();
    this.request_interval = false;
    this.request_completed = 0;

    this.model = new model.Queue();
    this.cookies = new model.CookieJar();
    this.log = new model.Log();
    if (baseurl) {
        var href = url.parse(baseurl);
        this.host = href.host;
        this.protocol = href.protocol;
        this.queue(null, baseurl)
    }
}
Client.prototype.resolve = function (referrer, href) {

    href = (href.indexOf('//') == 0 ? referrer.protocol : '') + href;
    if (href.indexOf('http') != 0)
        href = url.resolve(referrer.protocol + '//' + referrer.host + (referrer.pathname || ''), href);

    href = url.parse(href);
    href.pathname = (href.pathname || '/');
    href.pathname = (href.pathname.indexOf('/') != 0 ? '/' : '') + href.pathname.trim();

    if (!this.caseSensitive)
        href.pathname = href.pathname.toLowerCase();

    return href;
}
Client.prototype.parseComplete = function (obj) {
    for (var i = 0; i < obj.hrefs.length; i++) {
        this.queue(obj.href, obj.hrefs[i]);
    }
    var size = Buffer.byteLength(obj.content, 'utf8');
    this.log.write({
        parsetime: obj.parseTime,
        href: obj.href.protocol + '//' + obj.href.host + obj.href.pathname,
        status: (obj.response ? obj.response.statusCode : 0),
        time: obj.responseTime,
        size: size
    })
    if (this.request_completed % 100 == 0)
        this.emit('kmod', this.request_completed)
}


Client.prototype.queue = function (referrer, href) {
    var self = this;
    var href = this.resolve(referrer, href);
    if (['http:', 'https:'].indexOf(href.protocol) < 0)
        return;
    if (this.url_limit && this.url_limit <= this.model.count)
        return;
    if (!this.followSubdomain && href.host != this.host)
        return;
    if (!this.external && href.host.substring(href.host.length - this.host.length) != this.host)
        return;
    this.model.insert(href);
    if (!this.request_interval) {
        this.request_interval = setInterval(function () { self.run(); }, 1000 / this.request_maxpersecond);
    }
}
Client.prototype.clear = function () {
    this.stop();
    this.model = new model.Queue();
}
Client.prototype.stop = function () {
    if (!this.request_interval)
        return;
    clearInterval(this.request_interval);
    this.request_interval = false;
    this.emit('done');
}

Client.prototype.run = function () {
    var href = this.model.get();

    var self = this;
    var start = Date.now();
    if (!href && !this.request_open && start - self.request_last > 10000) {
        return this.stop();
    }
    if (!href || (this.request_limit && this.request_limit <= this.request_open)) {
        return;
    }
    var options = {
        host: href.host,
        path: href.pathname,
    }
    options.headers = this.request_headers;
    options.headers.Cookie = this.cookies.get(href);
    start = Date.now();
    if (href.protocol == 'https:')
        var req = https.get(options, responseHandler).on('error', errorHandler);
    else
        var req = http.get(options, responseHandler).on('error', errorHandler);

    self.request_open++;
    self.request_last = start;
    function responseHandler(response) {
        // if (response.statusCode != 200) {
        //     self.request_open--;
        //     return;
        // }
        if (response.headers['set-cookie'])
            self.cookies.set(href, response.headers['set-cookie']);
        response.setEncoding('utf8');
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            self.request_open--;
            self.request_completed++;
            setImmediate(function () {
                self.emit('parseStart', { href: href, response: response, responseTime: (Date.now() - start), content: body });
            })
        });
    }
    function errorHandler(e) {
        self.request_open--;
        self.request_completed++;
        setImmediate(function () {
            self.emit('parseStart', { href: href, response: null, responseTime: (Date.now() - start), content: '' });
        });
    }
}

exports.Client = Client;