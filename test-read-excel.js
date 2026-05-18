const XLSX = require('xlsx');

function readHeaders(file) {
  try {
    const wb = XLSX.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n=== Headers for ${file} ===`);
    if (json.length > 0) {
      console.log(json[0].join(" | "));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}

readHeaders('./template_ar.xlsx');
readHeaders('./template_ap.xlsx');
