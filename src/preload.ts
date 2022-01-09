import fs = require('fs');
import path = require('path');
import { contextBridge, ipcRenderer } from 'electron';
import { writeFile } from 'xlsx';

const commissionsPath = path.join(__dirname, 'commissions.json');

if (!fs.existsSync(commissionsPath)) {
    fs.writeFileSync(path.join(__dirname, 'commissions.json'), "{}");
}

const commissions = JSON.parse(fs.readFileSync(commissionsPath).toString());
console.log(commissions);
contextBridge.exposeInMainWorld('commissions', {
    get: (key: string) => commissions[key],
    set: (key: string, value: any) => {
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
