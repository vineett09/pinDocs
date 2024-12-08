const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const settings = require("electron-settings");

let mainWindow;
let fileWindow;

app.whenReady().then(() => {
  createMainWindow();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.loadFile("index.html");

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.executeJavaScript(`
      const openFileButton = document.getElementById('open-file');
      openFileButton.addEventListener('click', () => {
        window.electronAPI.openFile();
      });
    `);
  });
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["jpg", "png", "gif"] },
      { name: "Documents", extensions: ["pdf", "docx", "txt"] },
    ],
  });

  if (canceled || filePaths.length === 0) return;
  const filePath = filePaths[0];
  createTransparentWindow(filePath);
});

function createTransparentWindow(filePath) {
  const windowOpacity = settings.getSync("windowOpacity") || 1;

  fileWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    opacity: windowOpacity,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  fileWindow.loadFile("fileWindow.html");
  fileWindow.webContents.once("did-finish-load", () => {
    fileWindow.webContents.send("render-file", filePath);
  });

  const fileExtension = path.extname(filePath).toLowerCase();
  if (fileExtension === ".pdf") {
    fileWindow.loadURL(`file://${filePath}`);
  } else if ([".jpg", ".png", ".gif"].includes(fileExtension)) {
    fileWindow.loadURL(
      `data:image/${fileExtension.slice(1)};base64,${fs
        .readFileSync(filePath)
        .toString("base64")}`
    );
  } else if ([".txt", ".docx"].includes(fileExtension)) {
    fileWindow.loadFile(filePath);
  } else {
    fileWindow.loadURL("about:blank");
  }

  ipcMain.on("adjust-transparency", (event, value) => {
    fileWindow.setOpacity(parseFloat(value));
    settings.setSync("windowOpacity", value);
  });

  ipcMain.on("move-window", (event, { x, y }) => {
    fileWindow.setBounds({
      x,
      y,
      width: fileWindow.getBounds().width,
      height: fileWindow.getBounds().height,
    });
  });

  ipcMain.on("close-file-window", () => {
    fileWindow.close();
  });
}

// Handle opacity adjustment from the main window
ipcMain.on("adjustOpacity", (event, value) => {
  if (fileWindow) {
    fileWindow.setOpacity(parseFloat(value));
    settings.setSync("windowOpacity", value);
  }
});
