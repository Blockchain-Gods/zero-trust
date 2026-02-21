"use client";
import { Developer } from "@/lib/types/defense-types";
import { useDraggable } from "@dnd-kit/core";

export default function DeveloperCard({
  developer,
  isCommitting,
}: {
  developer: Developer;
  isCommitting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: developer.id,
      data: { developer },
      disabled: developer.isAssigned,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const borderClass = isCommitting
    ? "border-amber-500 opacity-70 animate-pulse"
    : developer.isAssigned
      ? "border-blue-700 opacity-40"
      : isDragging
        ? "border-purple-500 opacity-50"
        : "border-gray-600 hover:border-purple-400 cursor-grab active:cursor-grabbing";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-slate-800 rounded-lg p-3 border-2 transition ${borderClass}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{developer.avatar}</span>
        <span className="text-white font-semibold">{developer.name}</span>
        {isCommitting && (
          <span className="ml-auto text-xs text-amber-400">committing…</span>
        )}
        {developer.isAssigned && !isCommitting && (
          <span className="ml-auto text-xs text-blue-400">🔒</span>
        )}
      </div>
      <div className="flex gap-1 flex-wrap">
        {developer.skills.map((skill) => (
          <span
            key={skill.id}
            className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-xs"
          >
            {skill.icon} {skill.name}
          </span>
        ))}
      </div>
    </div>
  );
}
