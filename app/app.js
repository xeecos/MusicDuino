const { BrowserWindow, app, ipcMain, powerSaveBlocker } = require('electron')
const path = require("path");
const Promise = require('promise');
let mainWindow;
var rootPath = path.join(__dirname, "/..");
global.__is_packaged = false;
if (rootPath.indexOf("asar") > -1) {
    rootPath = path.join(__dirname, "/../..");
    global.__is_packaged = true;
}
global.__root_path = rootPath;

const SerialPort = require('serialport');
const MidiPlayer = require('midi-player-js');
const fs = require('fs');
var serial;
var midiBuffer = [];
var index = 0;
SerialPort.list(function(err, ports) {
    console.log(ports);
});
// Initialize player and register event handler 
var prevTick = 0;
var Player = new MidiPlayer.Player(function(event) {
    // console.log(event);
    // var midiMessage = MIDIMessage(event);
    // console.log("Parsed", midiMessage);
    if (event.name == 'Note on' && event.velocity > 0) {
        var note = event.noteNumber;
        var tick = event.tick;
        var track = event.track;
        var velocity = event.velocity;

        var delta = event.delta;
        // if (track > 5) {
        serial.write(new Buffer([track, note, Math.max(1, 0xff & (velocity / 5)), 0xff]));
        // console.log(track);
        // }
        prevTick = tick;
        // Player.stop();
        //document.querySelector('#track-' + event.track + ' code').innerHTML = JSON.stringify(event);
        //console.log(event);
    }
});
const id = powerSaveBlocker.start('prevent-app-suspension')

function createWindow() {

    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: "Midi Player",
        width: 1024,
        height: 768,
        'web-preferences': {
            'plugins': true,
            nodeIntegration: true
        }
    })

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/../web/index.html`)

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
    mainWindow.on('closed', function() {
        mainWindow = null
    })

    serial = new SerialPort("/dev/tty.Makeblock-ELETSPP", {
        baudRate: 115200
    }, function() {
        serial.on('data', function(data) {
            // console.log(data.toString());
        });
        //SKYCITY3 LIONKING tpfo4 m0457_01 m0457_05 m0457_03 m0346_01 12289115690 12289115691 12289115692 12394614940 senbon levan

    });
}

var list = ["SKYCITY3", "LIONKING", "tpfo4", "m0457_01", "m0457_05", "m0457_03", "m0346_01", "12289115690", "12289115691", "12289115692", "12394614940", "senbon", "levan"];
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {

    app.quit();
})

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow()
    }
})
ipcMain.on('ready', (event, arg) => {
    //监听来自ipcRender的ready消息
    Player.stop();
    Player.loadFile(__dirname + '/../web/' + list[arg.file * 1] + '.mid');
    Player.play();
});
var index = 0;
ipcMain.on('stop', (event, arg) => {
    Player.stop();
});
ipcMain.on('music', (event, arg) => {
    //监听来自ipcRender的ready消息
    if (index > 100) {
        index = 0;
    }
    serial.write(new Buffer([(index++) % 4, arg.note, 8, 0xff]));
});
process.on('uncaughtException', function(err) {
    console.log(err);

});