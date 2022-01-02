const fs = require('fs');
const path = require('path');
const { contextBridge, ipcRenderer} = require('electron');
const { writeFile } = require('xlsx');

const commissions = JSON.parse(fs.readFileSync(path.join(__dirname, 'commissions.json')));
contextBridge.exposeInMainWorld('commissions', {
    get: (key) => commissions[key],
    set: (key, value) => {
        commissions[key] = value;
        const json = JSON.stringify(commissions);
        fs.writeFileSync(path.join(__dirname, 'commissions.json'), json);
    }
});

contextBridge.exposeInMainWorld('writeWorkbook', writeFile);

process.once('loaded', () => {
    window.addEventListener('message', evt => {
        if (evt.data.type === 'select-dirs') {
            ipcRenderer.send('select-dirs')
        }
    })
})

ipcRenderer.on('dir-result', (_, path) => {
    window.postMessage({
        type: 'dir-result',
        path: path
    });
});
