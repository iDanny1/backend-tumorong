import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';
import { QuotationPaper } from '../src/components/quotations/QuotationPaper';
import { freshQuote, type QuoteData } from '../src/lib/quotation';
const data: QuoteData = { ...freshQuote(), pricesIncludeVat: true, items: [30, 10].map(discount => ({
  productId: '', name: 'Hộp quà Tết', unit: 'Hộp', quantity: 8, unitPrice: 2640000,
  discount, discountType: 'percent', vatRate: 10, imageUrl: '', packaging: '',
})) };
const html = renderToStaticMarkup(<QuotationPaper data={data} />);
const css = readFileSync('src/components/quotations/quotation-paper.css', 'utf8');
writeFileSync('tmp/discount-column-preview.html', `<!doctype html><meta charset="utf-8"><style>${css}
body { margin:0; padding:16px; background:#fff; }
.quotation-paper { width:340px; min-height:0; padding:0; margin:0; box-shadow:none; }
.quote-paper-header,.quote-paper-info,.quote-paper-summary-cell,.quote-paper-notes,caption { display:none!important; }
colgroup { display:none; }
.quote-paper-lines { width:340px; table-layout:auto; font-size:18px; }
.quote-paper-lines th { font-size:18px; height:60px; text-transform:none; }
thead th:not(:nth-child(8)),tbody tr td:not(:nth-child(8)):not(:nth-child(9)) { display:none; }
.quote-paper-lines tbody tr td { height:74px; width:50%; padding:10px; background:#e5efdd; }
.quote-paper-lines tbody tr:has(.quote-paper-summary-cell) { display:none; }
</style>${html}`);
