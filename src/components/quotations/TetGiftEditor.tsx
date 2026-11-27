import { useId, useState } from 'react';
import type { Product } from '../../types';
import type { GiftPart, TetGift } from '../../lib/quotation';
import { money } from '../../lib/stockIssue';

function key(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').trim().toLowerCase();
}

export function TetGiftEditor({ gift, products, pricesIncludeVat, onChange }: {
  gift: TetGift; products: Product[]; pricesIncludeVat?: boolean; onChange: (gift: TetGift) => void;
}) {
  const boxList = useId();
  const [query, setQuery] = useState('');
  const matches = products.filter(p => key([p.name, p.sku, p.barcode].join(' ')).includes(key(query)));
  const boxes = products.filter(p => /hop|khay/.test(key(p.name)));
  function add(name: string, price: number) {
    onChange({ ...gift, toppings: [...gift.toppings, { name, price }] });
    setQuery('');
  }
  function priceInput(part: GiftPart, update: (price: number) => void) {
    return <input aria-label={'Giá của ' + (part.name || 'hộp')} type="number" min="0" step="1"
      placeholder="Nhập giá (đ)" value={part.price < 0 ? '' : part.price}
      onChange={e => update(e.target.value === '' ? -1 : Number(e.target.value))} />;
  }
  return <div className="tet-gift-editor">
    <div className="issue-grid">
      <label className="issue-field"><span>1. Chọn hộp quà</span>
        <input list={boxList} maxLength={300} value={gift.box.name} placeholder="Chọn hoặc nhập tên mẫu hộp"
          onChange={e => {
            const name = e.target.value;
            const product = boxes.find(p => p.name === name);
            onChange({ ...gift, box: { name, price: product ? (product.price > 0 ? product.price : -1) : gift.box.price } });
          }} />
        <datalist id={boxList}>{Array.from(new Set(['Hộp quà Tết 2027', ...boxes.map(p => p.name)])).map(name => <option key={name} value={name} />)}</datalist>
      </label>
      <label className="issue-field"><span>{pricesIncludeVat ? 'Giá hộp đã gồm VAT (đ)' : 'Giá hộp chưa VAT (đ)'}</span>
        {priceInput(gift.box, price => onChange({ ...gift, box: { ...gift.box, price } }))}
        <small>Nhập 0 nếu giá một món đã bao gồm hộp.</small>
      </label>
    </div>
    {gift.box.name.trim() && <>
      <label className="issue-field"><span>2. Chọn topping · Đã chọn {gift.toppings.length} · Tối thiểu 3</span>
        <input type="search" value={query} maxLength={300} placeholder="Tìm theo tên, SKU hoặc nhập món ngoài danh mục" onChange={e => setQuery(e.target.value)} />
      </label>
      {query.trim() && <div className="issue-results">
        {matches.slice(0, 12).map(p => <button type="button" key={p._id} onClick={() => add(p.name, p.price > 0 ? p.price : -1)}>
          <strong>{p.name}</strong><small>{p.price > 0 ? money(p.price) + ' đ' : 'Nhập giá'}</small></button>)}
        {!matches.some(p => key(p.name) === key(query)) && <button type="button" onClick={() => add(query.trim(), -1)}>Thêm món “{query.trim()}”</button>}
      </div>}
      {gift.toppings.map((part, index) => <div className="tet-topping" key={index}>
        <label className="tet-topping-name">
          <span>{index + 1}.</span>
          <input aria-label={`Tên topping ${index + 1}`} maxLength={300} value={part.name}
            placeholder="Nhập tên topping"
            onChange={e => onChange({ ...gift, toppings: gift.toppings.map((p, i) => i === index ? { ...p, name: e.target.value } : p) })} />
        </label>
        {priceInput(part, price => onChange({ ...gift, toppings: gift.toppings.map((p, i) => i === index ? { ...p, price } : p) }))}
        <button type="button" className="issue-remove" aria-label={'Bỏ topping ' + part.name} onClick={() => onChange({ ...gift, toppings: gift.toppings.filter((_, i) => i !== index) })}>Bỏ</button>
      </div>)}
    </>}
  </div>;
}
