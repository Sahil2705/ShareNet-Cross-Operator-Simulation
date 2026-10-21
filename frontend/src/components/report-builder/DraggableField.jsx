import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Hash, Type, Calendar, CheckSquare, GripVertical } from 'lucide-react';

export default function DraggableField({ field, onQuickAdd }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.columnName}`,
    data: { field },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  const isNumeric = field.dataType === 'number';
  const isDate = field.dataType === 'date';
  const isBoolean = field.dataType === 'boolean';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all select-none ${
        isDragging
          ? 'opacity-60 ring-2 ring-brand-500 shadow-soft-lg bg-brand-50 border-brand-300'
          : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 shadow-soft-sm'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500">
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Data Type Icon */}
        <span
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
            isNumeric
              ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
              : isDate
              ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
              : isBoolean
              ? 'bg-purple-50 text-purple-600 border border-purple-200/60'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
          }`}
        >
          {isNumeric ? (
            <Hash className="w-3 h-3" />
          ) : isDate ? (
            <Calendar className="w-3 h-3" />
          ) : isBoolean ? (
            <CheckSquare className="w-3 h-3" />
          ) : (
            <Type className="w-3 h-3" />
          )}
        </span>

        <span className="font-medium text-slate-700 truncate group-hover:text-slate-900">
          {field.displayName || field.columnName}
        </span>
      </div>

      {onQuickAdd && (
        <button
          onClick={() => onQuickAdd(field)}
          title={isNumeric ? 'Add to Values / Y Axis' : 'Add to Category / X Axis'}
          className="opacity-0 group-hover:opacity-100 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-500 transition-opacity"
        >
          +
        </button>
      )}
    </div>
  );
}
