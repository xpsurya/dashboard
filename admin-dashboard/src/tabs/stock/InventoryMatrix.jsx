import { Grid3x3 } from 'lucide-react';
import { Card, EmptyState } from '../../components/common/ui';

export const ED_TONE = {
  critical: { badge: 'red', label: 'CRITICAL', cell: 'bg-red-500/15 text-red-200 ring-red-500/40' },
  warning: { badge: 'yellow', label: 'WARNING', cell: 'bg-amber-500/15 text-amber-200 ring-amber-500/40' },
  safe: { badge: 'green', label: 'SAFE', cell: 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/30' },
};

export const daysLabel = (d) => (d < 0 ? 'EXPIRED' : `${d} hari`);

export function InventoryMatrix({ stores, products, cells }) {
  return (
    <Card title="Live Store Inventory Matrix" subtitle="Stok fisik terakhir per store × SKU · warna = status expired date" icon={Grid3x3} bodyClass="p-0" testId="inventory-matrix">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="th left-0 z-30 min-w-[200px] border-r border-slate-700">Store</th>
              {products.map((p) => (
                <th key={p.sku} className="th min-w-[110px] text-center" title={p.product_name}>
                  <p className="font-mono text-blue-200">{p.sku}</p>
                  <p className="max-w-[120px] truncate text-[10px] normal-case tracking-normal text-slate-500">{p.product_name}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map((s, i) => {
              const bg = i % 2 ? 'row-odd' : 'row-even';
              return (
                <tr key={s.store_code} data-testid={`inventory-row-${s.store_code}`}>
                  <td className={`td sticky left-0 z-10 border-r border-slate-700 ${bg}`}>
                    <p className="font-medium text-slate-100">{s.store_name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{s.store_code} · {s.area}</p>
                  </td>
                  {products.map((p) => {
                    const it = cells.get(`${s.store_code}|${p.sku}`);
                    return (
                      <td key={p.sku} className={`td text-center ${bg}`}>
                        {it ? (
                          <div className={`inline-flex min-w-[70px] flex-col items-center rounded-md px-2 py-1 ring-1 ring-inset ${ED_TONE[it.level].cell}`} title={`ED ${it.expired_date}`}>
                            <span className="font-mono text-sm font-bold">{it.qty_stock}</span>
                            <span className="text-[10px] opacity-80">{daysLabel(it.days)}</span>
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!stores.length && <EmptyState text="Tidak ada data stok untuk filter ini." testId="inventory-matrix-empty" />}
      </div>
    </Card>
  );
}
