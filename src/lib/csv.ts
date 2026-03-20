export function generateCSV(data: any[], headers: string[]): string {
  if (data.length === 0) return headers.join(',') + '\n';
  
  const rows = data.map(row => {
    return headers.map(header => {
      let val = row[header];
      if (val === undefined || val === null) val = '';
      if (typeof val === 'string') {
        // Escape quotes
        val = val.replace(/"/g, '""');
        // Wrap in quotes if it contains commas, quotes, or newlines
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val}"`;
        }
      }
      return val;
    }).join(',');
  });
  
  return headers.join(',') + '\n' + rows.join('\n');
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 1) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const rawline = lines[i];
    const vals = [];
    let cur = '';
    let inQuotes = false;
    
    for (let j = 0; j < rawline.length; j++) {
      const char = rawline[j];
      if (char === '"') {
        if (inQuotes && rawline[j+1] === '"') {
          cur += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        vals.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    vals.push(cur);
    
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] || '';
    });
    records.push(obj);
  }
  
  return records;
}
