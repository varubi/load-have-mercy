const { app, BrowserWindow } = require('electron'),
    path = require('path'),
    url = require('url'),
    appcode = require('./src/appcode.js');

let window, client = new appcode.Client();
client.on('done', () => { window.webContents.send('client.done') })
client.on('kmod', (obj) => { window.webContents.send('client.kmod', obj) })
client.on('parseStart', (obj) => { window.webContents.send('client.parseStart', obj) });

function createWindow() {
    // Create the browser window.
    window = new BrowserWindow({
        width: 1200,
        height: 900,
        title: 'Load Have Mercy'
    })

    window.setMenu(null);

    window.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    window.webContents.openDevTools()

    window.on('closed', () => { win = null })
}

app.on('ready', createWindow)
app.on('window-all-closed', () => { process.platform !== 'darwin' && app.quit() })
app.on('activate', () => { win === null && createWindow() })



exports.crawl = function (config) {
    client.crawl(config.base_url)
    client.url_limit = config.url_limit;
    client.url_passes = config.url_passes;
    client.request_maxpersecond = config.request_maxpersecond;
    client.request_limit = config.request_limit;
    client.run();
};

exports.view = function () {
    return client.log.view();
};
exports.parseComplete = function (obj) {
    client.parseComplete(obj);
}