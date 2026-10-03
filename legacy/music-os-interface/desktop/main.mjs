import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let serverHandle;

async function startLocalServer() {
  process.env.NODE_ENV = "production";
  process.env.MUSIC_OS_DESKTOP = "1";
  process.env.MUSIC_OS_LOCAL_DATA_DIR = path.join(app.getPath("userData"), "compositions");

  const serverEntry = path.join(app.getAppPath(), "dist", "index.js");
  const serverModule = await import(pathToFileURL(serverEntry).href);
  serverHandle = await serverModule.startServer({ preferredPort: 3210, host: "127.0.0.1" });
  return serverHandle.port;
}

async function createWindow(port) {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#020b05",
    title: "MUSIC OS",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await window.loadURL(`http://127.0.0.1:${port}/?desktop=1`);
  return window;
}

app.whenReady().then(async () => {
  try {
    const port = await startLocalServer();
    await createWindow(port);
  } catch (error) {
    console.error("MUSIC OS desktop startup failed", error);
    await dialog.showMessageBox({
      type: "error",
      title: "MUSIC OS no pudo iniciar",
      message: "El servidor local no pudo iniciarse.",
      detail: error instanceof Error ? error.message : String(error),
    });
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (serverHandle?.server) serverHandle.server.close();
  if (os.platform() !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverHandle?.server) serverHandle.server.close();
});
