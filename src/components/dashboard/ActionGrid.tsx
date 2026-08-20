import { Sparkles } from 'lucide-react';
import ActionButton from './ActionButton';
import { ACTION_ROW_META, type ActionConfig } from './dashboard-actions';

export default function ActionGrid({ actions }: { actions: ActionConfig[][] }) {
  return (
    <div className="space-y-2.5">
      {/* Section heading */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md shadow-primary/30">
          <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-[12px] font-bold text-text-main leading-tight">Quick Actions</h3>
          <p className="text-[9.5px] text-text-muted font-medium leading-none mt-0.5">Everything you need, one tap away</p>
        </div>
      </div>

      {actions.map((row, rowIndex) => {
        const meta = ACTION_ROW_META[rowIndex];
        const RowIcon = meta?.icon;

        return (
          <div
            key={rowIndex}
            className={[
              'relative bg-white border border-ui-border/60 rounded-[20px] p-2.5',
              'shadow-[0_2px_12px_rgba(0,0,0,0.03)]',
              'overflow-hidden',
            ].join(' ')}
          >
            {/* Per-row themed gradient backdrop (very subtle) */}
            <div
              className={[
                'absolute inset-0 pointer-events-none',
                'bg-gradient-to-br',
                meta?.gradientClass || 'from-white to-white',
              ].join(' ')}
            />

            {/* Decorative blurred blob in the corner */}
            <div
              className={[
                'absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl',
                'opacity-50 pointer-events-none',
                meta?.dotClass || 'bg-gray-300',
              ].join(' ')}
            />

            {/* Header — accent bar + icon chip + label + fading divider */}
            {meta && RowIcon && (
              <div className="relative flex items-center gap-2 px-1.5 mb-2.5">
                <div
                  className={[
                    'w-0.5 h-5 rounded-full shrink-0',
                    meta.accentBar,
                  ].join(' ')}
                />
                <div className="w-7 h-7 rounded-xl bg-white border border-ui-border/60 flex items-center justify-center shadow-sm shrink-0">
                  <RowIcon className={`w-3.5 h-3.5 ${meta.iconColor}`} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-secondary whitespace-nowrap">
                  {meta.label}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-ui-border/80 via-ui-border/30 to-transparent ml-1" />
              </div>
            )}

            {/* Action buttons */}
            <div className="relative grid grid-cols-3 gap-2">
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
