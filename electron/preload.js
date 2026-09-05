const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('reignAPI', {
  load: ()=> ipcRenderer.invoke('reign:load'),
  save: (data)=> ipcRenderer.invoke('reign:save', data),
  pickFile: ()=> ipcRenderer.invoke('reign:pickFile'),
  isElectron: true
});
