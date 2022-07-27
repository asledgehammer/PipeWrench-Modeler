const {app, BrowserWindow} = require('electron');
const path = require('path');
const remote = require('electron');

remote.nativeTheme.themeSource = 'dark';
remote.nativeTheme.shouldUseDarkColors = true;

app.commandLine.appendArgument('--enable-experimental-web-platform-features');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

let mainWindow;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,

    setMenuBarVisibility: true,
    // autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegrationInWorker: true,
      experimentalFeatures: true,
      contextIsolation: false,
      safeDialogs: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: './assets/media/icon.png',
  });

  // mainWindow.setMenuBarVisibility(false);
  // mainWindow.setAutoHideMenuBar(true);
  // mainWindow.setMenu(null);
  mainWindow.webContents.openDevTools({
    mode: 'right',
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  if (mainWindow === null) createWindow();
});
