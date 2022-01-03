import { uniq } from 'lodash';
import { utils, read, Sheet } from 'xlsx';

export function getAOATable(e: InputEvent): Promise<any[][]> {
    return new Promise<any[][]>((resolve, reject) => {
        try {
            const file = (<HTMLInputElement>e.target).files[0];
            const reader = new FileReader();
            reader.onload = e => {
                const workbook = read(e.target.result);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const table = sheet_to_aoa(sheet);
                resolve(table);
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            reject(err);
        }
    });
}

export const headers = [
    "Category",
    "Item Name",
    "Item Variation",
    "SKU",
    "Items Sold",
    "Product Sales",
    "Items Refunded",
    "Refunds",
    "Discounts & Comps",
    "Net Sales",
    "Gross Sales"
]

function sheet_to_aoa(sheet: Sheet): any[][] {
    const json = utils.sheet_to_json(sheet);
    const table = [];
    json.forEach(row => {
        const rowArray: string[] = headers.map(key => row[key]);
        table.push(rowArray);
    });

    return table;
}

export function renderTable(table: any[][], element: HTMLTableElement): void {
    // Header
    const headString = headers.reduce((string, header) => string += `<th class="th">${header}</th>`, '');
    element.innerHTML = `<thead><tr class="bg-gray-200">${headString}</tr></thead>`;

    // Body
    const tbody = document.createElement('tbody');
    tbody.innerHTML = table.reduce((string, row, index) => {
        if (index == 0) return string;
        const rowString = headers.reduce((string, header, index) => {
            return string += `<td class="td">${row[index] !== undefined ? row[index] : ''}</td>`
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
