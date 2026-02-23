"use client";

import { Developer } from "@/lib/types/defense-types";
import { useDraggable } from "@dnd-kit/core";
import { Lock } from "lucide-react";

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
    ? "border-amber-400/60 opacity-70 animate-pulse"
    : developer.isAssigned
      ? "border-blue-500/40 opacity-40"
      : isDragging
        ? "border-stone-500 opacity-50"
        : "border-stone-700 hover:border-stone-500 cursor-grab active:cursor-grabbing";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`border bg-stone-900/50 p-3 transition ${borderClass}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{developer.avatar}</span>
        <span className="text-sm text-white font-semibold">
          {developer.name}
        </span>
        {isCommitting && (
          <span className="ml-auto text-sm text-amber-400">committing…</span>
        )}
        {developer.isAssigned && !isCommitting && (
          <Lock className="ml-auto w-3.5 h-3.5 text-blue-400" />
        )}
      </div>
      <div className="flex gap-1 flex-wrap">
        {developer.skills.map((skill) => (
          <span
            key={skill.id}
            className="px-2 py-0.5 border border-stone-700 bg-stone-800 text-stone-400 text-sm"
          >
            {skill.icon} {skill.name}
          </span>
        ))}
      </div>
    </div>
  );
}
