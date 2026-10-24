const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    useContentSize: true,
    title: "5 Ночей з Мілкою",
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Hide default menu bar for an immersive experience
  Menu.setApplicationMenu(null);
  win.setMenuBarVisibility(false);

  // Load the compiled React application index.html
  win.loadFile(path.join(__dirname, 'dist/index.html')).catch((err) => {
    console.error("Failed to load index.html:", err);
  });

  // Open external links in user's default browser instead of inside electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Disable hardware acceleration warning if needed, but keeping it default is fine.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
