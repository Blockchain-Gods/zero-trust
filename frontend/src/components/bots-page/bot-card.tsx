import { BOT_TYPES } from "@/lib/constants";
import { SavedBot, BotTypeTag } from "@/lib/types/types";
import { slugify } from "@/lib/utils";
import Image from "next/image";

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
      className={`bg-slate-800 rounded-lg p-6 cursor-pointer transition border-2 ${
        isSelected
          ? "border-purple-500 bg-purple-500/10"
          : "border-transparent hover:border-gray-600"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image
            src={slugify(botMeta.icon)}
            alt={botMeta.name}
            width={56}
            height={56}
            className="object-contain"
            onError={(e) => {
              // Fallback to emoji if image missing
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <h3 className="text-xl font-bold text-white">{bot.botName}</h3>
            <p className="text-md text-gray-400">{bot.botType}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-400 hover:text-red-300 transition"
        >
          🗑️
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{bot.timesPlayed}</div>
          <div className="text-xs text-gray-400">Times Played</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-400">
            {bot.avgDamageDealt ? bot.avgDamageDealt.toFixed(0) : 0}%
          </div>
          <div className="text-xs text-gray-400">Avg Damage</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">
            {bot.threatCount}
          </div>
          <div className="text-xs text-gray-400">Threats</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          Created{" "}
          {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : "N/A"}
        </div>
      </div>
    </div>
  );
}
