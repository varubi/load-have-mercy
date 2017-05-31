const fs = require('fs')

function Queue() {
    this.count = 0;
    this.list = {
        'http:': {},
        'https:': {}
    };
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
function CookieJar() {
    this.domains = {};
    this.lax = {};
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
        var cookie = {
            name: kv[0],
            value: kv[1] || '',
        };
        while (data.length) {
            kv = data.shift().split('=')
            kv[0] = kv[0].toLowerCase();
            if (['path', 'secure', 'domain', 'samesite'].indexOf(kv[0]))
                cookie[kv[0]] = cookie[kv[1]];
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

Log.prototype.view = function (sort, limit) {
    var results = [];
    limit = limit || this.history.length;
    console.log(limit)
    if (sort) {
        for (var i = 0; i < this.history.length; i++) {
            results.push(this.history[i]);
        }
        results.sort((a, b) => {
            var v1 = a[sort] || '';
            var v2 = b[sort] || '';

            if (v1 < v2)
                return -1;

            if (v1 > v2)
                return 1;

            return 0;
        })
        results.slice(0, limit - 1)
    } else {
        for (var i = 0; i < limit; i++) {
            results.push(this.history[i]);
        }
    }
    return results;

}


exports.Queue = Queue;
exports.CookieJar = CookieJar;
exports.Log = Log;