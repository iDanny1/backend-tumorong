import type { Response } from 'express';
import * as xlsx from 'xlsx';

export function readSpreadsheet<T>(buffer: Buffer, options?: xlsx.Sheet2JSONOpts): T[] {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json<T>(worksheet, options);
}

export function sendSpreadsheet(
  res: Response,
  rows: Record<string, unknown>[],
  sheetName: string,
  filename: string,
) {
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(rows), sheetName);
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}
