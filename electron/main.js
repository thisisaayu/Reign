const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const USER_DATA = () => path.join(app.getPath('userData'), 'reign-data.json');

function readDisk(){
  try { const p=USER_DATA(); if(fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,'utf-8')); } catch {}
  return null;
}
function writeDisk(data){
  try { fs.mkdirSync(path.dirname(USER_DATA()),{recursive:true}); fs.writeFileSync(USER_DATA(), JSON.stringify(data,null,2),'utf-8'); } catch(e){ console.error(e); }
}

function createWindow(){
  const win = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 900, minHeight: 600,
    backgroundColor: '#151520',
    title: 'Reign — Writing Studio',
    icon: path.join(__dirname, '..', 'assets', 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    autoHideMenuBar: true
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  // open devtools in dev
  if(process.env.REIGN_DEV) win.webContents.openDevTools({mode:'detach'});
}

ipcMain.handle('reign:load', ()=> readDisk());
ipcMain.handle('reign:save', (_evt, data)=> writeDisk(data));
ipcMain.handle('reign:pickFile', async ()=>{
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties:['openFile'], filters:[{name:'Text/Markdown', extensions:['md','txt','html']}] });
  if(canceled || !filePaths[0]) return null;
  try { return { path: filePaths[0], content: fs.readFileSync(filePaths[0],'utf-8') }; } catch { return null; }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', ()=> { if(process.platform!=='darwin') app.quit(); });
app.on('activate', ()=> { if(BrowserWindow.getAllWindows().length===0) createWindow(); });
