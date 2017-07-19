const { app, BrowserWindow, webContents, session } = require('electron'),
    path = require('path'),
    url = require('url'),
    cp = require('child_process'),
    parser = cp.fork('./src/parser.js'),
    appcode = require('./src/appcode.js');

let mainWindow, client = new appcode.Client(parser);
client.on('done', () => { mainWindow.webContents.send('client.done') })
client.on('kmod', (obj) => { mainWindow.webContents.send('client.kmod', obj) })
client.on('parseStart', (obj) => { mainWindow.webContents.send('client.parseStart', obj) });

parser.on('close', (x) => { console.log(x) })
parser.on('exit', (x) => { console.log(x) })
parser.on('error', (x) => { console.log(x) })
parser.on('disconnect', (x) => { console.log(x) })


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        'minHeight': 800,
        'minWidth': 1024,
        title: 'Load Have Mercy',
        frame: false
    })

    mainWindow.setMenu(null);

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    mainWindow.webContents.openDevTools()
    mainWindow.on('closed', () => { mainWindow = null })
}

app.on('ready', createWindow)
app.on('window-all-closed', () => { process.platform !== 'darwin' && app.quit() })
app.on('activate', () => { mainWindow === null && createWindow() })



exports.crawl = function (config) {
    ses = session.fromPartition('electron');
    ses.cookies.get({}, (error, cookies) => {
        config.cookies = cookies;
        client.crawl(config)
        client.run();
    })
};

exports.view = function () {
    return client.log.view();
};
exports.query = function (match, flags) {
    return client.log.query(match, flags);
};
exports.parseComplete = function (obj) {
    client.parseComplete(obj);
}