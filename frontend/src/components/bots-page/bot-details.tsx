import { BOT_TYPES, SPECIAL_ABILITIES } from "@/lib/constants";
import { SavedBot, BotTypeTag } from "@/lib/types/types";
import { slugify } from "@/lib/utils";
import Image from "next/image";

export default function BotDetails({ bot }: { bot: SavedBot }) {
  // const botType = BOT_TYPES[normaliseTagHyphen(bot.botType)];
  const botType = BOT_TYPES[bot.botType];
  // const primaryTarget = SYSTEM_TARGETS[bot.primaryTarget];
  const botSlug = slugify(bot.botType) as BotTypeTag;
  const botMeta = BOT_TYPES[botSlug];

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
        <Image
          src={slugify(botMeta.icon)}
          alt={botMeta.name}
          width={160}
          height={160}
          className="mb-2"
        />
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{bot.botName}</h2>
          <p className="text-gray-400">{bot.botType}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Targeting */}
        {/* <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Target Systems
          </h3>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-4xl">{primaryTarget.icon}</span>
              <div>
                <div className="text-white font-medium">
                  {primaryTarget.name}
                </div>
                <div className="text-xs text-gray-400">
                  Primary Target (70%)
                </div>
              </div>
            </div>
            {bot.secondaryTargets.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400 mb-2">
                  Secondary Targets (30%)
                </div>
                <div className="flex gap-4">
                  {bot.secondaryTargets.map((targetId) => {
                    const target = SYSTEM_TARGETS[targetId];
                    return (
                      <div
                        key={targetId}
                        className="flex items-center gap-1 text-sm text-gray-300"
                      >
                        <span>{target.icon}</span>
                        <span>{target.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div> */}

        {/* Abilities */}
        {bot.abilities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Abilities</h3>
            <div className="space-y-2">
              {bot.abilities.map((abilityId) => {
                const ability = SPECIAL_ABILITIES[abilityId];
                return (
                  <div
                    key={abilityId}
                    className="bg-slate-700 rounded-lg p-3 flex items-start gap-4"
                  >
                    <Image
                      src={ability.icon}
                      alt={ability.name}
                      width={80}
                      height={80}
                      className="mb-2"
                    />
                    <div>
                      <div className="text-white font-medium">
                        {ability.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {ability.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Configuration
          </h3>
          <div className="bg-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Victory Condition</span>
              <span className="text-white font-medium capitalize">
                {bot.victoryCondition.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Damage Multiplier</span>
              <span className="text-white font-medium">
                {bot.damageMultiplier}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Threat Count</span>
              <span className="text-white font-medium">{bot.threatCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Spawn Pattern</span>
              <span className="text-white font-medium capitalize">
                {bot.spawnPattern}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Skill Diversity</span>
              <span className="text-white font-medium capitalize">
                {bot.skillDiversity}
              </span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Performance</h3>
          <div className="bg-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Times Deployed</span>
              <span className="text-white font-medium">{bot.timesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Damage</span>
              <span className="text-purple-400 font-medium">
                {bot.avgDamageDealt ? bot.avgDamageDealt.toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Deploy Button */}
        <button className="w-full py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition">
          🎮 Deploy to Defense Game
        </button>
      </div>
    </div>
  );
}
