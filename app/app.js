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
    for (var i in ports) {
        if (ports[i].comName.indexOf("CH341") > -1 || ports[i].manufacturer.indexOf("wch.cn") > -1) {
            serial = new SerialPort(ports[i].comName, {
                baudRate: 115200
            }, function() {
                serial.on('data', function(data) {
                    console.log(data.toString());
                    if (data.toString().split(":").length > 2) {
                        // var dat = data.toString().split(":")
                        // timeFile += dat[2].split("\r\n").join("") + ",";
                        // duringFile += dat[3].split("\r\n").join("") + ",";
                        // noteFile += (((dat[0] % 4) << 6) + (dat[1] - 20)) + ",";
                    }
                });
                //SKYCITY3 LIONKING tpfo4 m0457_01 m0457_05 m0457_03 m0346_01 12289115690 12289115691 12289115692 12394614940 senbon levan

            });
            break;
        }
    }
});
// Initialize player and register event handler 
var prevTick = 0;
var totalNotes = 0;
var timeFile = "";
var noteFile = "";
var duringFile = "";
var Player = new MidiPlayer.Player(function(event) {
    // console.log(event);
    // var midiMessage = MIDIMessage(event);
    // console.log("Parsed", midiMessage);
    if (event.name == 'Note on' && event.velocity > 0) {
        var note = event.noteNumber;
        var tick = event.tick; //new Date().getTime();
        var track = event.track;
        var velocity = event.velocity;
        var during = Math.max(1, 0xff & (velocity / 5));
        var delta = event.delta;
        if ((tick - prevTick) >= 0) {
            serial.write(new Buffer([track % 4, note, during, 0xff]));
            totalNotes++;
            console.log(totalNotes + " - " + (tick - prevTick) + " - " + track + ":" + (note - 25));
            timeFile += (tick - prevTick) + ",";
            duringFile += during + ",";
            noteFile += (((track % 4) << 6) + (note - 25)) + ",";
        }

        prevTick = tick;
        // Player.stop();
        //document.querySelector('#track-' + event.track + ' code').innerHTML = JSON.stringify(event);
        //console.log(event);
    } else {
        if (event.string) {
            console.log(event.track + ":" + event.string);
        }
    }
});

function parseTracks(events) {
    return;
    timeFile = "";
    noteFile = "";
    duringFile = "";
    totalNotes = 0;
    for (var i = 0; i < events.length; i++) {
        if (events[i])
            for (var j = 0; j < events[i].length; j++) {
                var event = events[i][j];
                if (event.name == 'Note on' && event.velocity > 0) {
                    var note = event.noteNumber;
                    var tick = event.tick; //new Date().getTime();
                    var track = event.track;
                    var velocity = event.velocity;
                    var during = Math.max(1, 0xff & (velocity / 5));
                    var delta = event.delta;
                    if ((tick - prevTick) >= 0) {
                        totalNotes++;
                        console.log(totalNotes + " - " + (tick - prevTick) + " - " + track + ":" + (note - 25));
                        timeFile += (tick - prevTick) + ",";
                        duringFile += during + ",";
                        noteFile += (((track % 4) << 6) + (note - 25)) + ",";
                    }

                    prevTick = tick;
                }
            }
    }
    if (timeFile.length > 40) {
        fs.writeFileSync("./time.txt", timeFile);
        fs.writeFileSync("./notes.txt", noteFile);
        fs.writeFileSync("./durings.txt", duringFile);
    }
}
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

}

var list = ["slam", "SKYCITY3", "Gravity_Falls_Theme", "tpfo4", "m0457_01", "m0457_05", "m0457_03", "m0346_01", "12289115690", "12289115691", "12289115692", "12394614940", "senbon", "levan"];
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
    Player.loadFile(__dirname + '/../web/midi/' + list[arg.file * 1] + '.mid');
    Player.play();
    parseTracks(Player.getTracks().events);
    timeFile = "";
    noteFile = "";
    duringFile = "";
    totalNotes = 0;
});
var index = 0;
ipcMain.on('stop', (event, arg) => {
    Player.stop();
    if (timeFile.length > 40) {
        fs.writeFileSync("./time.txt", timeFile);
        fs.writeFileSync("./notes.txt", noteFile);
        fs.writeFileSync("./durings.txt", duringFile);
        timeFile = "";
        noteFile = "";
        duringFile = "";
        totalNotes = 0;
    }
});
ipcMain.on('music', (event, arg) => {
    //监听来自ipcRender的ready消息
    if (index > 100) {
        index = 0;
    }
    serial.write(new Buffer([(index++) % 4, arg.note, 10, 0xff]));
});
process.on('uncaughtException', function(err) {
    console.log(err);

});