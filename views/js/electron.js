var electron = require('electron');
var app = {
    incoming: electron.ipcRenderer,
    outgoing: electron.remote.require('./main')
}