/**
 * Utility to export JSON data to a CSV file and trigger a download.
 * @param {Array} data - Array of objects to export.
 * @param {string} fileName - Name of the file (without extension).
 */
export const exportToCSV = (data, fileName) => {
  if (!data || !data.length) {
    console.error('No data available to export');
    return;
  }

  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName];
        // Handle values with commas by wrapping in quotes
        const stringValue = String(value ?? '').replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',')
    )
  ];

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
