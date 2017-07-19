const http = require('http'),
    https = require('https'),
    path = require('path'),
    url = require('url'),
    model = require('./model.js'),
    events = require('events');

function Client(parser) {
    var self = this;
    this.parser = parser;
    this.parser.on('message', (m) => { self.parserHandler(m) });
}
Client.prototype = new events.EventEmitter;
Client.prototype.crawl = function (config) {
    this.counter = 0;
    this.protocol = 'http:';
    this.host = 'example.com';
    this.pathname = '';
    this.url_limit = config.url_limit || 1000;
    this.url_passes = config.url_passes || 0;
    this.request_maxpersecond = config.request_maxpersecond || 50;
    this.request_limit = config.request_limit || 50;
    this.external = !!config.external;
    this.followSubdomain = !!config.followSubdomain;
    this.caseSensitive = !!config.caseSensitive;
    this.parseList = [];

    this.request_headers = {
        "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36'
    };

    this.request_open = 0;
    this.request_last = Date.now();
    this.request_interval = false;
    this.parse_interval = false;
    this.request_completed = 0;

    this.model = new model.Queue(config.protocols);
    this.cookies = new model.CookieJar(config.cookies);
    this.log = new model.Log();

    if (config.base_url) {
        var href = url.parse(config.base_url);
        this.host = href.host;
        this.protocol = href.protocol;
        this.queue(null, config.base_url)
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
Client.prototype.parserHandler = function (obj) {
    obj = JSON.parse(obj);
    switch (obj.type) {
        case 'parse':
            for (var i = 0; i < obj.content.length; i++) {
                this.parseComplete(obj.content[i]);
            }
            break;
    }
}
Client.prototype.parseStart = function () {
    var ary = this.parseList;
    this.parseList = [];
    this.parser.send(JSON.stringify({ type: 'parse', content: ary }));
}
Client.prototype.parseComplete = function (obj) {
    for (var i = 0; i < obj.hrefs.length; i++) {
        this.queue(obj.href, obj.hrefs[i]);
    }
    var size = Buffer.byteLength(obj.content, 'utf8');
    this.log.write({
        parsetime: obj.parseTime,
        secure: obj.href.protocol == 'https:',
        host: obj.href.host,
        path: obj.href.pathname,
        status: obj.responseStatus,
        ttfb: obj.ttfb,
        time: obj.responseTime,
        size: size,
        startTime: obj.startTime
    });
    this.request_completed++;
    if (this.request_completed % 100 == 0)
        this.emit('kmod', this.request_completed);
}
Client.prototype.parseQueue = function (obj) {
    this.parseList.push(obj)
}

Client.prototype.queue = function (referrer, href) {
    var self = this;
    var href = this.resolve(referrer, href);
    if (['http:', 'https:'].indexOf(href.protocol) < 0)
        return;
    if (this.url_limit && this.url_limit < this.model.count)
        return;
    if (!this.followSubdomain && href.host != this.host)
        return;
    if (!this.external && href.host.substring(href.host.length - this.host.length) != this.host)
        return;
    this.model.insert(href);
    if (!this.request_interval) {
        this.request_interval = setInterval(function () { self.run(); }, 1000 / this.request_maxpersecond);
    }
    if (!this.parse_interval) {
        this.parse_interval = setInterval(function () { self.parseStart(); }, 1000);
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
    clearInterval(this.parse_interval);
    this.request_interval = false;
    this.parse_interval = false;
    this.emit('done');
}

Client.prototype.run = function () {

    if (this.request_limit && this.request_limit <= this.request_open) {
        return;
    }
    var href = this.model.get();
    var self = this;
    var start = Date.now();
    if (!href) {
        return !this.request_open && (this.request_completed == this.counter || start - self.request_last > 10000) && this.stop();
    }
    var options = {
        host: href.host,
        path: href.pathname,
    }
    this.counter++;
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
        var ttfb = Date.now() - start;
        if (response.headers['set-cookie'])
            self.cookies.set(href, response.headers['set-cookie']);
        response.setEncoding('utf8');
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            self.request_open--;
            self.parseQueue({ ttfb: ttfb, href: href, responseStatus: response.statusCode, startTime: start, responseTime: (Date.now() - start), content: body });
        });
    }
    function errorHandler(e) {
        self.request_open--;
        var ttfb = Date.now() - start;
        self.parseQueue({ ttfb: ttfb, href: href, responseStatus: 0, startTime: start, responseTime: (Date.now() - start), content: '' });
    }
}

exports.Client = Client;