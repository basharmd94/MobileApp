import ActionButton from './ActionButton';
import type { ActionConfig } from './dashboard-actions';

const ROW_META = [
  { label: 'Order Placing', dotClass: 'bg-amber-400' },
  { label: 'Delivery & Rec', dotClass: 'bg-indigo-400' },
  { label: 'Return', dotClass: 'bg-emerald-400' },
];

export default function ActionGrid({ actions }: { actions: ActionConfig[][] }) {
  return (
    <div className="bg-[#fff8f0] border border-[#f0e4d0] rounded-[22px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-2.5">
      {actions.map((row, rowIndex) => {
        const meta = ROW_META[rowIndex];
        return (
          <div key={rowIndex} className="bg-white rounded-2xl border border-[#f5ede0] overflow-hidden">
            {/* Group label */}
            {meta && (
              <>
                <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                  <span className="text-[9.5px] font-bold tracking-[0.08em] uppercase text-[#9c8878]">
                    {meta.label}
                  </span>
                </div>
                <div className="h-px bg-[#fdf0e4] mx-3.5" />
              </>
            )}
            {/* Buttons */}
            <div className="grid grid-cols-3 gap-2 p-2.5">
              {row.map((action) => (
                <ActionButton key={action.id} config={action} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}