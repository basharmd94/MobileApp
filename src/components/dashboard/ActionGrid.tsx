import ActionButton from './ActionButton';
import type { ActionConfig } from './dashboard-actions';

export default function ActionGrid({ actions }: { actions: ActionConfig[][] }) {
  return (
    <div className="bg-[#fff7ed] border border-orange-100 rounded-[16px] p-3 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col gap-2">
      {actions.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-3 gap-2">
          {row.map((action) => (
            <ActionButton key={action.id} config={action} />
          ))}
        </div>
      ))}
    </div>
  );
}