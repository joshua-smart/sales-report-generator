import { clone, round, uniq } from "lodash";
import { getJsonTable, renderTable } from "./lib/excel";
import { utils } from 'xlsx';
import getDate from "./lib/date";

type Commissions = {
    set: (key: string, value: any) => void,
    get: (key: string) => string
}

const commissions = <Commissions>(<any>window).commissions;

class Main {

    private table: any[];
    private categories: string[];
    private outputFolder: string;

    constructor() {
        // Assign source file input listener
        document.querySelector('#file-input').addEventListener('input', async e => this.takeTableInput(<InputEvent>e));
        // Display default outputFolder
        if (commissions.get('__defaultPath')) {
            document.querySelector('#output-dir-result').innerHTML = `${commissions.get('__defaultPath')}`;
            this.outputFolder = commissions.get('__defaultPath');
            if (this.table) this.enableDownload();
        }
        // Assign folder select
        document.querySelector('#output-dir-input').addEventListener('click', e => {
            e.preventDefault();
            window.postMessage({type: 'select-dirs'});
        });
        // Assing folder select response listener
        window.addEventListener('message', evt => {
            if (evt.data.type == 'dir-result') {
                const path = evt.data.path;
                if (!path) {
                    document.querySelector('#output-dir-result').innerHTML = 'No folder selected';
                    this.outputFolder = null;
                    this.disableDownload();
                    return;
                };
                document.querySelector('#output-dir-result').innerHTML = path;
                this.outputFolder = evt.data.path;
                if(this.table) this.enableDownload();
                commissions.set('__defaultPath', evt.data.path);
            }
        });
    }

    private enableDownload() {
        document.querySelector('#download-button').removeAttribute('disabled');
        (<HTMLButtonElement>document.querySelector('#download-button')).onclick = () => this.downloadAll();
    }

    private disableDownload() {
        document.querySelector('#download-button').setAttribute('disabled', 'true');
        (<HTMLButtonElement>document.querySelector('#download-button')).onclick = null;
    }

    private downloadAll() {
        let downloadCount = this.categories.reduce((count, category) => {
            const commission = commissions.get(category) ? commissions.get(category) : {};
            if (commission['excluded']) return count;
            if (isNaN(+commission['value']) || commission['value'] == '') return count;
            const categoryTable = this.table.reduce((array, row) => {
                if (row['Category'] != category) return array;
                const {Category, Tax, ...newRow} = row;
                return array.concat(newRow);
            }, []);

            if (!commission['type'] || commission['type'] == '£') {
                const value = Number(commission['value']);
                const totalItems = categoryTable.reduce((total: number, row: { [x: string]: number; }) => {
                    return total + row['Items Sold'] - row['Items Refunded'];
                }, 0);
                const totalSales = categoryTable.reduce((total: number, row: { [x: string]: any; }) => {
                    return total + Number(row['Gross Sales']);
                }, 0);

                categoryTable.push({
                    'Refunds': `Total items:`,
                    'Discounts & Comps': `${totalItems}`,
                    'Net Sales': `Total sales:`,
                    'Gross Sales': `£${totalSales}`
                });
                categoryTable.push({
                    'Net Sales': `Commission @ £${value}:`,
                    'Gross Sales': `£${totalItems * value}`
                });
                categoryTable.push({
                    'Net Sales': 'Total owed:',
                    'Gross Sales': `£${totalSales - totalItems * value}`
                });
            } else {
                const value = Number(commission['value']);
                const totalItems = categoryTable.reduce((total: number, row: { [x: string]: number; }) => {
                    return total + row['Items Sold'] - row['Items Refunded'];
                }, 0);
                const totalSales = categoryTable.reduce((total: number, row: { [x: string]: any; }) => {
                    return total + Number(row['Gross Sales']);
                }, 0);
                const commissionValue = round(totalSales * value / 100, 2);

                categoryTable.push({
                    'Refunds': `Total items:`,
                    'Discounts & Comps': `${totalItems}`,
                    'Net Sales': `Total sales:`,
                    'Gross Sales': `£${round(totalSales, 2)}`
                });
                categoryTable.push({
                    'Net Sales': `Commission @ ${value}%:`,
                    'Gross Sales': `£${commissionValue}`
                });
                categoryTable.push({
                    'Net Sales': 'Total owed:',
                    'Gross Sales': `£${round(totalSales - commissionValue, 2)}`
                });
            }

            const sheet = utils.json_to_sheet(categoryTable);
            const workBook = utils.book_new();
            workBook.Sheets['Sheet1'] = sheet;
            workBook.SheetNames.push('Sheet1');
            (<any>window).writeWorkbook(workBook, `${this.outputFolder}\\${category}-${getDate()}.xlsx`);
            return count+1;
        }, 0);
        global.alert(`${downloadCount} files downloaded`);
    }

    private takeTableInput(e: InputEvent): void {
        // Get table from data
        getJsonTable(<InputEvent>e).then(table => {
            this.table = table;
            // Render table to DOM
            const inputTable = <HTMLTableElement>document.querySelector('#input-table');
            renderTable(this.table, inputTable);
            this.initaliseCategories();
            if (this.outputFolder) this.enableDownload();
        }).catch(err => {
            this.table = null;
            this.disableDownload();
            console.error(err);
        });
    }

    private initaliseCategories(): void {
        this.categories = uniq(this.table.map(row => row["Category"]));
        const tableBody = document.querySelector('#commissions-table tbody');
        this.categories.forEach((category) => {
            const commission = commissions.get(category) ? commissions.get(category) : {};

            const row = document.createElement('tr');
            row.className = 'tr';
            row.innerHTML = `
            <td class="td text-center align-middle">
                <input class="excluded-checkbox m-auto" type="checkbox" ${commission['excluded'] ? "checked" : ""}></input>
            </td>
            <td class="td">${category}</td>
            <td class="td">
                <div class="flex">
                    <input class="commission-value-input w-16 pl-1 mr-1" type="text" value="${commission['value'] ? commission['value'] : ""}"/>
                    <select class="commission-type-select">
                        <option ${commission['type'] == '£' ? "selected" : ""} value="£">£ per item</option>
                        <option ${commission['type'] == '%' ? "selected" : ""} value="%">%</option>
                    </select>
                </div>
            </td>`;

            row.querySelector('.excluded-checkbox').addEventListener('click', e => {
                const newCommission = clone(commission);
                newCommission['excluded'] = (<HTMLInputElement>e.target).checked;
                commissions.set(category, newCommission);
            });

            row.querySelector('.commission-type-select').addEventListener('change', e => {
                const newCommission = clone(commission);
                newCommission['type'] = (<HTMLInputElement>e.target).value
                commissions.set(category, newCommission);
            });

            row.querySelector('.commission-value-input').addEventListener('input', e => {
                const value = (<HTMLInputElement>e.target).value
                const newCommission = clone(commission);
                newCommission['value'] = value;
                commissions.set(category, newCommission);
                if(isNaN(+value) || value == "") {
                    (<HTMLElement>e.target).classList.remove('bg-gray-300');
                    return;
                }
                (<HTMLElement>e.target).classList.add('bg-gray-300');
            });
            row.querySelector('.commission-value-input').dispatchEvent(new Event('input'));

            tableBody.appendChild(row);
        });
    }
}

new Main();
