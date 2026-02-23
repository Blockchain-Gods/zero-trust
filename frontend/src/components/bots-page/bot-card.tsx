import { BOT_TYPES } from "@/lib/constants";
import { SavedBot, BotTypeTag } from "@/lib/types/types";
import { slugify } from "@/lib/utils";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export default function BotCard({
  bot,
  isSelected,
  onSelect,
  onDelete,
}: {
  bot: SavedBot;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const botSlug = slugify(bot.botType) as BotTypeTag;
  const botMeta = BOT_TYPES[botSlug];

  return (
    <div
      onClick={onSelect}
      className={`border cursor-pointer transition p-5 ${
        isSelected
          ? "border-amber-400/60 bg-amber-400/5"
          : "border-stone-800 bg-stone-900/30 hover:border-stone-600"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image
            src={slugify(botMeta.icon)}
            alt={botMeta.name}
            width={48}
            height={48}
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <h3 className="text-base font-bold text-white">{bot.botName}</h3>
            <p className="text-sm text-stone-500 uppercase tracking-wide">
              {bot.botType}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-stone-700 hover:text-red-400 transition p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="played" value={String(bot.timesPlayed)} />
        <Stat
          label="avg dmg"
          value={`${bot.avgDamageDealt ? bot.avgDamageDealt.toFixed(0) : 0}%`}
          accent="amber"
        />
        <Stat label="threats" value={String(bot.threatCount)} accent="green" />
      </div>

      <div className="mt-4 pt-3 border-t border-stone-800">
        <div className="text-sm text-stone-700">
          created{" "}
          {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : "N/A"}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "green";
}) {
  const valueColor =
    accent === "amber"
      ? "text-amber-400"
      : accent === "green"
        ? "text-green-400"
        : "text-white";
  return (
    <div>
      <div className={`text-xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </div>
      <div className="text-sm text-stone-600 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
