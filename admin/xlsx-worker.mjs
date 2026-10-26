import {parentPort,workerData} from 'node:worker_threads';
import ExcelJS from 'exceljs';
try{
 const book=new ExcelJS.Workbook();await book.xlsx.load(Buffer.from(workerData));if(book.worksheets.length>20)throw Error('Maximum 20 de foi.');
 const sheets=book.worksheets.map(sheet=>{if(sheet.rowCount>2000||sheet.columnCount>100)throw Error('Maximum 2.000 rânduri și 100 coloane per foaie.');const rows=[];for(let n=1;n<=sheet.rowCount;n++){const row=sheet.getRow(n),cells=[];for(let c=1;c<=sheet.columnCount;c++){const v=row.getCell(c).value;let value=v instanceof Date?v.toISOString().slice(0,10):v&&typeof v==='object'?('formula'in v||'sharedFormula'in v?(typeof v.result==='object'?v.result?.error||'#ERROR!':v.result??'#ERROR!'):v.error||v.text||v.richText?.map(t=>t.text).join('')||''):v??'';if(String(value).length>10000)throw Error('Celulă prea lungă.');cells.push(value);}rows.push(cells);}return {name:sheet.name,rows};});parentPort.postMessage({sheets});
}catch(e){parentPort.postMessage({error:'Excel invalid: '+e.message});}
