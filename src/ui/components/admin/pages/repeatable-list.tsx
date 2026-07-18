"use client";

import type { ReactNode } from "react";

// Generic editor for an ordered list of items. The parent owns the array state;
// this component renders each row via a render prop and handles add/remove.
// 有序列表项的通用编辑器。数组状态由父组件持有，本组件通过 render prop 渲染每行并处理增删。
export function RepeatableList<T>({
  items,
  onChange,
  createItem,
  renderRow,
  addLabel,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  createItem: () => T;
  renderRow: (
    item: T,
    update: (patch: Partial<T>) => void,
    index: number,
  ) => ReactNode;
  addLabel: string;
}) {
  const updateAt = (index: number, patch: Partial<T>) => {
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-mist-100/10 bg-ink-950 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-mist-400">#{index + 1}</span>
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="text-xs text-mist-300 hover:text-red-600"
            >
              删除
            </button>
          </div>
          {renderRow(item, (patch) => updateAt(index, patch), index)}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, createItem()])}
        className="border border-mist-100/15 px-4 py-2 text-sm text-mist-200 hover:border-jade-500"
      >
        + {addLabel}
      </button>
    </div>
  );
}
