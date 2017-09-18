const fs = require('fs')

function DataStore() {
    this.samples = 0;
    this.queueId = 0;
    this.queued = [];
    this.logs = Object.create(null);
}
DataStore.prototype.queue = function (referrer, href) {
    if (!this.logs[href.fullpath]) {
        this.logs[href.fullpath] = {
            id: this.queued.length,
            href: href,
            requests: [],
            referrers: {},
            averages: {}
        };
        this.queued.push(href);
    }
    this.logs[href.fullpath].referrers[referrer] = true;
}
DataStore.prototype.reloadQueue = function () {
    this.queueId = 0;
}
DataStore.prototype.getNextUrl = function () {
    if (this.queueId >= this.queued.length)
        return;
    this.queueId++;
    return this.queued[this.queueId - 1];
}
DataStore.prototype.log = function (obj) {
    var size = Buffer.byteLength(obj.content, 'utf8');
    this.logs[obj.href.fullpath].requests.push({
        status: obj.responseStatus,
        size: size,
        startTime: obj.startTime,
        ttfb: obj.ttfb,
        time: obj.responseTime,
        parsetime: obj.parseTime,
    });
}

DataStore.prototype.view = function (limit, sort, direction) {
    var keys = Object.keys(this.logs)
    var results = [];
    limit = limit || keys.length;
    sort = sort || 'path';
    direction = direction || 1;
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        results.push(this.logs[keys[i]]);
    }
    // results.sort((a, b) => {
    //     var v1 = a[sort] || '';
    //     var v2 = b[sort] || '';

    //     if (v1 == v2)
    //         return 0;
    //     return (v1 > v2 ? 1 : -1) * direction;

    // })
    return results.slice(0, limit - 1);
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
function KMSEvent(timestamp) {
    this.requests = {
        total: 0,
        opened: 0,
        closed: 0,
        active: 0,
        urls: []
    };
    this.responses = {
        codes: {
            0: 0,
            200: 0
        },
        ttfb: []
    }
    this.timestamp = timestamp || Date.now();
    this.bandwidth = 0;
}
exports.KMSEvent = KMSEvent;
exports.CookieJar = CookieJar;
exports.DataStore = DataStore;