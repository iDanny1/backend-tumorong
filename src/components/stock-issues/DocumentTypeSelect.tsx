import React from 'react';

export type DocumentType = 'stock-issue' | 'handover' | 'quotation';

interface Props {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
  disabled?: boolean;
}

export function DocumentTypeSelect({ value, onChange, disabled }: Props) {
  return <label className="issue-field">
    <span>Loại phiếu</span>
    <select aria-label="Loại phiếu" value={value} disabled={disabled} onChange={event => onChange(event.target.value as DocumentType)}>
      <option value="stock-issue">Phiếu xuất kho</option>
      <option value="handover">Biên bản bàn giao</option>
      <option value="quotation">Báo giá</option>
    </select>
  </label>;
}
