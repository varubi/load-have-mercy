const { app, BrowserWindow, webContents, session } = require('electron'),
    path = require('path'),
    url = require('url'),
    cp = require('child_process'),
    parser = cp.fork(`${__dirname}/src/parser.js`),
    appcode = require(`${__dirname}/src/appcode.js`);

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
exports.getSiteTree = function () {
    var data = client.database.view();
    var tree = { name: 'root', children: {}, size: 0 };
    for (var i = 0; i < data.length; i++) {
        tree.size++;
        var path = data[i].href.path.split('/');
        var ref = travi(tree, data[i].href.protocol);
        ref = travi(ref, data[i].href.host);
        for (var ii = 1; ii < Math.min(3, path.length); ii++) {
            if (!path[ii])
                break;
            ref = travi(ref, path[ii])
        }
    }
    for (var key in tree.children)
        otherfy(tree.children[key]);
    childAry(tree)
    return tree;
    function otherfy(ref) {
        var size = 0;
        for (var key in ref.children) {
            if (ref.children[key].size < .1 * ref.size) {
                size += ref.children[key].size;
                delete ref.children[key]
            } else {
                otherfy(ref.children[key])
            }
        }
        if (size > 0)
            ref.children['...'] = { name: '...', size: size, children: {} };
    }
    function childAry(ref) {
        var children = [];
        for (var key in ref.children) {
            childAry(ref.children[key])
            children.push(ref.children[key])
        }
        ref.children = children;
        if (ref.children.length)
            delete ref.size;
    }
    function travi(ref, key) {
        if (!ref.children[key])
            ref.children[key] = {
                name: key,
                size: 0,
                children: {}
            }
        ref.children[key].size++;
        return ref.children[key];
    }

}
exports.view = function () {
    return client.database.view();
};
exports.query = function (match, flags) {
    return client.database.query(match, flags);
};
exports.parseComplete = function (obj) {
    client.parseComplete(obj);
}