const fs = require('fs')

function Queue(protocols) {
    this.count = 0;
    this.list = {};

    protocols = (protocols || 'http,https').split(',');
    for (var i = 0; i < protocols.length; i++) {
        this.list[protocols[i].trim() + ':'] = Object.create(null);
    }
    this.queue = [];
}
Queue.prototype.insert = function (href) {
    if (!this.list[href.protocol])
        return;
    if (!this.list[href.protocol][href.host]) {
        this.list[href.protocol][href.host] = {};
    }
    if (!this.list[href.protocol][href.host][href.pathname]) {
        this.list[href.protocol][href.host][href.pathname] = {};
        this.queue.push(href);
        this.count++;
    }
}
Queue.prototype.get = function () {
    return this.queue.shift();
}
Queue.prototype.clone = function () {
    var cloned = new Queue();
    cloned.count = this.count;
}

function CookieJar(cookies) {
    this.domains = {};
    if (Array.isArray(cookies) && cookies.length)
        this.load(cookies)
}
CookieJar.prototype.load = function (cookies) {
    for (var i = 0; i < cookies.length; i++) {
        cookie = {};
        cookie.domain = cookies[i].domain;
        cookie.path = cookies[i].path;
        cookie.name = cookies[i].name;
        cookie.value = cookies[i].value;
        cookie.domainrev = cookies[i].domain.split('').reverse().join('');
        if (cookies[i].secure)
            cookie.secure = '';

        if (!this.domains[cookie.domainrev])
            this.domains[cookie.domainrev] = {};
        this.domains[cookie.domainrev][cookie.name] = cookie;

    }
}
CookieJar.prototype.set = function (referrer, cookies) {
    if (!cookies)
        return;

    var jar = [];
    for (var i = 0; i < cookies.length; i++) {
        jar.push(parseCookie(cookies[i]));
    }
    var secure = referrer.protocol == 'https:';
    var domain = referrer.host;
    var domainrev = referrer.host.split('').reverse().join('');
    var path = referrer.pathname;

    for (var i = 0; i < jar.length; i++) {
        var name = jar[i].name;
        if (!secure && (jar[i].hasOwnProperty('secure') || name.indexOf('__secure')))
            continue;
        if (!secure && name.indexOf('__secure') && (jar[i].hasOwnProperty('domain') || (jar[i].hasOwnProperty('path') && jar[i].pathname != '/')))
            continue;

        if (jar[i].hasOwnProperty('domainrev') && (jar[i].domainrev.indexOf(domainrev) != 0 || jar[i].domainrev.length < domainrev.length))
            continue;

        var usedomain = jar[i].domainrev || domainrev;
        if (!this.domains[usedomain])
            this.domains[usedomain] = {};

        this.domains[usedomain][name] = jar[i];
    }

    function parseCookie(cookie) {
        var data = cookie.split(';');
        var kv = data.shift().split('=');
        var cookie = {};
        cookie.name = kv.shift();
        cookie.value = kv.join('=');
        while (data.length) {
            var kv = data.shift().split('=')
            kv[0] = kv[0].toLowerCase();
            var key = kv[0].trim().toLowerCase();
            if (['path', 'domain'].indexOf(key) >= 0)
                cookie[key] = (kv[1] || '').trim();
            else if (['secure', '__secure'].indexOf(key) >= 0)
                cookie[key] = !!(1 * 1);
        }
        if (cookie.domain)
            cookie.domainrev = cookie.domain.split('').reverse().join('')
        return cookie;
    }
}
CookieJar.prototype.get = function (referrer) {
    var secure = referrer.protocol == 'https:';
    var domain = referrer.host;
    var domainrev = referrer.host.split('').reverse().join('');
    var path = referrer.pathname;
    var cookies = [];

    for (var drev in this.domains) {
        if (drev.indexOf(domainrev) != 0 || drev.length < domainrev.length)
            continue;

        var jar = this.domains[drev];
        for (var i in jar) {
            var name = jar[i].name;
            if (!secure && (jar[i].hasOwnProperty('secure') || name.indexOf('__secure')))
                continue;
            if (!secure && name.indexOf('__secure') && (jar[i].hasOwnProperty('domain') || (jar[i].hasOwnProperty('path') && jar[i].pathname != '/')))
                continue;

            if (jar[i].hasOwnProperty('domainrev') && (jar[i].domainrev.indexOf(domainrev) != 0 || jar[i].domainrev.length < domainrev.length))
                continue;
            cookies.push(jar[i].name + '=' + jar[i].value);

        }
    }
    return cookies.join('; ')
}

function Log() {
    this.history = [];
}
Log.prototype.write = function (stats) {
    this.history.push(stats);
}
Log.prototype.view = function (limit, sort, direction) {
    var results = [];
    limit = limit || this.history.length;
    sort = sort || 'path';
    direction = direction || 1;

    for (var i = 0; i < this.history.length; i++) {
        results.push(this.history[i]);
    }
    results.sort((a, b) => {
        var v1 = a[sort] || '';
        var v2 = b[sort] || '';

        if (v1 == v2)
            return 0;
        return (v1 > v2 ? 1 : -1) * direction;

    })
    return results.slice(0, limit - 1);

}

exports.Queue = Queue;
exports.CookieJar = CookieJar;
exports.Log = Log;