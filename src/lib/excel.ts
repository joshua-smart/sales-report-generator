import { utils, read } from 'xlsx';

export function getJsonTable(e: InputEvent): Promise<[]> {
    return new Promise<[]>((resolve, reject) => {
        try {
            const file = (<HTMLInputElement>e.target).files[0];
            const reader = new FileReader();
            reader.onload = e => {
                const workbook = read(e.target.result);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = utils.sheet_to_json(sheet);
                resolve(<[]>json);
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            reject(err);
        }
    });
}

export function renderTable(table: any[], element: HTMLTableElement): void {
    // Header
    const headString = Object.keys(table[0]).reduce((string, header) => string += `<th class="th">${header}</th>`, '');
    element.innerHTML = `<thead><tr class="bg-gray-200">${headString}</tr></thead>`;

    // Body
    const tbody = document.createElement('tbody');
    tbody.innerHTML = table.reduce((string, row) => {
        const rowString = Object.keys(table[0]).reduce((string, header) => {
            return string += `<td class="td">${row[header] !== undefined ? row[header] : ''}</td>`
        }, '');
        return string += `<tr class="tr">${rowString}</tr>`;
    }, '');
    element.appendChild(tbody);
}

export function generateOutputTable(table: [], category: string): any[] {
    return table.reduce((array, row) => {
        if (row["Category"] === category) {
            const { Category, ...newRow } = <{Category: any}>row;
            return array.concat([newRow]);
        }
        return array;
    }, []);
}
