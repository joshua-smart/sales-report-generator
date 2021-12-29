import * as _ from 'lodash';

const fileInput = <HTMLInputElement>document.querySelector('#file-input');
fileInput.addEventListener('input', () => {
    const filePath = (<any>fileInput.files[0]).path;
});
