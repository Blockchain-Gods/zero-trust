import { BOT_TYPES, SPECIAL_ABILITIES } from "@/lib/constants";
import { SavedBot, BotTypeTag } from "@/lib/types/types";
import { slugify } from "@/lib/utils";
import Image from "next/image";
import { Gamepad2 } from "lucide-react";

export default function BotDetails({ bot }: { bot: SavedBot }) {
  const botSlug = slugify(bot.botType) as BotTypeTag;
  const botMeta = BOT_TYPES[botSlug];

  return (
    <div className="border border-stone-800 bg-stone-900/30">
      {/* Hero */}
      <div className="flex items-center gap-4 p-5 border-b border-stone-800">
        <Image
          src={slugify(botMeta.icon)}
          alt={botMeta.name}
          width={80}
          height={80}
          className="object-contain"
        />
        <div>
          <h2 className="text-2xl font-bold text-white">{bot.botName}</h2>
          <p className="text-sm text-stone-500 uppercase tracking-wide mt-0.5">
            {bot.botType}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Abilities */}
        {bot.abilities.length > 0 && (
          <Section title="abilities">
            <div className="space-y-2">
              {bot.abilities.map((abilityId) => {
                const ability = SPECIAL_ABILITIES[abilityId];
                return (
                  <div
                    key={abilityId}
                    className="flex items-start gap-3 border border-stone-800 bg-stone-900/50 p-3"
                  >
                    <Image
                      src={ability.icon}
                      alt={ability.name}
                      width={36}
                      height={36}
                      className="shrink-0"
                    />
                    <div>
                      <div className="text-sm text-stone-200 font-bold">
                        {ability.name}
                      </div>
                      <div className="text-sm text-stone-500">
                        {ability.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Configuration */}
        <Section title="configuration">
          <div className="space-y-2">
            <ConfigRow
              label="victory condition"
              value={bot.victoryCondition.replace("_", " ")}
            />
            <ConfigRow
              label="damage multiplier"
              value={`${bot.damageMultiplier}x`}
            />
            <ConfigRow label="threat count" value={String(bot.threatCount)} />
            <ConfigRow label="spawn pattern" value={bot.spawnPattern} />
            <ConfigRow label="skill diversity" value={bot.skillDiversity} />
          </div>
        </Section>

        {/* Performance */}
        <Section title="performance">
          <div className="space-y-2">
            <ConfigRow label="times deployed" value={String(bot.timesPlayed)} />
            <ConfigRow
              label="average damage"
              value={`${bot.avgDamageDealt ? bot.avgDamageDealt.toFixed(1) : 0}%`}
              accent
            />
          </div>
        </Section>

        {/* Deploy */}
        <button className="w-full flex items-center justify-center gap-2 bg-amber-400 text-stone-950 py-3 font-bold text-sm hover:bg-amber-300 transition uppercase tracking-widest">
          <Gamepad2 className="w-4 h-4" />
          deploy to defense game
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm text-stone-500 uppercase tracking-widest">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ConfigRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm border border-stone-800 bg-stone-900/50 px-3 py-2">
      <span className="text-stone-500">{label}</span>
      <span
        className={`font-bold capitalize ${accent ? "text-amber-400" : "text-stone-200"}`}
      >
        {value}
      </span>
    </div>
  );
}
