const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let hasInput = false
let items = []

process.stdin.on('data', (chunk) => {
  hasInput = true
  items = chunk.toString().split('\n')
});

let mainWindow

function createWindow () {
  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height: 30,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  })

  if (hasInput) {
    mainWindow.webContents.send('items', { items, custom: true });
  } else {
    const child_process = require('child_process');
    child_process.exec('ls /Applications | grep .app ; ls ~/Applications | grep .app ',
    function (error, stdout, stderr) {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }

      mainWindow.webContents.send('items', {
        items: stdout.split('\n').map(item => item.replace('.app', '')).map(item => item),
        custom: false
      });
    });
  } 

  mainWindow.loadURL(`file://${__dirname}/index.html`)

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

electron.ipcMain.on('op', (event, arg) => {
  if (arg.name === 'close') {
    app.quit();
  }
  if (arg.name === 'start') {
    if (!hasInput) {
      const child_process = require('child_process');

      child_process.exec('open -a "' +  arg.proc + '"')
    }
    process.stdout.write(arg.proc);
    app.quit()
  }
})

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

