"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BotConfig,
  BotType,
  SystemTargetId,
  ResourceAttackType,
  VictoryCondition,
  SpecialAbility,
} from "@/lib/types";
import {
  BOT_TYPES,
  SYSTEM_TARGETS,
  RESOURCE_ATTACKS,
  VICTORY_CONDITIONS,
  SPECIAL_ABILITIES,
  SPAWN_PATTERNS,
  SKILL_DIVERSITY,
} from "@/lib/constants";
import { saveBotToLocalStorage } from "@/lib/storage";

export default function BotCreatorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<BotConfig>>({
    botName: "",
    botType: "malware",
    primaryTarget: "compute",
    secondaryTargets: [],
    resourceAttack: "none",
    damageMultiplier: 1.0,
    victoryCondition: "time_survival",
    abilities: [],
    threatCount: 5,
    spawnPattern: "steady",
    skillDiversity: "medium",
  });

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDeploy = () => {
    const fullConfig: BotConfig = {
      botName: config.botName || "Unnamed Bot",
      botType: config.botType!,
      primaryTarget: config.primaryTarget!,
      secondaryTargets: config.secondaryTargets!,
      resourceAttack: config.resourceAttack!,
      damageMultiplier: config.damageMultiplier!,
      victoryCondition: config.victoryCondition!,
      abilities: config.abilities!,
      threatCount: config.threatCount!,
      spawnPattern: config.spawnPattern!,
      skillDiversity: config.skillDiversity!,
      creatorName: "Player", // Could add input for this
    };

    saveBotToLocalStorage(fullConfig);
    router.push("/bots");
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return config.botName && config.botName.length > 0;
      case 2:
        return config.primaryTarget;
      case 3:
        return true;
      case 4:
        return config.victoryCondition;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Bot Creation Studio
          </h1>
          <p className="text-gray-400">
            Design your attack bot - defenders will face your creation
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    s === step
                      ? "bg-purple-500 text-white"
                      : s < step
                        ? "bg-green-500 text-white"
                        : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {s}
                </div>
                {s < 6 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${s < step ? "bg-green-500" : "bg-gray-700"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-400">
            Step {step} of 6
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800 rounded-lg p-8 mb-6 min-h-100">
          {step === 1 && (
            <Step1BotIdentity config={config} setConfig={setConfig} />
          )}
          {step === 2 && (
            <Step2Targeting config={config} setConfig={setConfig} />
          )}
          {step === 3 && (
            <Step3ResourceAttack config={config} setConfig={setConfig} />
          )}
          {step === 4 && (
            <Step4VictoryCondition config={config} setConfig={setConfig} />
          )}
          {step === 5 && (
            <Step5Abilities config={config} setConfig={setConfig} />
          )}
          {step === 6 && (
            <Step6ThreatPattern config={config} setConfig={setConfig} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
          >
            Back
          </button>

          {step < 6 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleDeploy}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 transition animate-pulse"
            >
              🚀 Deploy Bot
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Bot Identity
function Step1BotIdentity({ config, setConfig }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Bot Identity</h2>

      <div className="mb-6">
        <label className="block text-gray-300 mb-2">Bot Name</label>
        <input
          type="text"
          value={config.botName || ""}
          onChange={(e) => setConfig({ ...config, botName: e.target.value })}
          placeholder="Enter a name for your bot..."
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-gray-300 mb-3">Bot Type</label>
        <div className="grid grid-cols-2 gap-3">
          {(
            Object.entries(BOT_TYPES) as [
              BotType,
              (typeof BOT_TYPES)[BotType],
            ][]
          ).map(([type, info]) => (
            <button
              key={type}
              onClick={() => setConfig({ ...config, botType: type })}
              className={`p-4 rounded-lg border-2 text-left transition ${
                config.botType === type
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-600 bg-slate-700 hover:border-gray-500"
              }`}
            >
              <div className="text-3xl mb-2">{info.icon}</div>
              <div className="text-white font-semibold mb-1">{info.name}</div>
              <div className="text-sm text-gray-400">{info.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 2: Targeting
function Step2Targeting({ config, setConfig }: StepProps) {
  const toggleSecondaryTarget = (target: SystemTargetId) => {
    const current = config.secondaryTargets || [];
    if (current.includes(target)) {
      setConfig({
        ...config,
        secondaryTargets: current.filter((t) => t !== target),
      });
    } else if (current.length < 2 && target !== config.primaryTarget) {
      setConfig({ ...config, secondaryTargets: [...current, target] });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Target Systems</h2>

      <div className="mb-6">
        <label className="block text-gray-300 mb-3">
          Primary Target (70% of attacks)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            Object.entries(SYSTEM_TARGETS) as [
              SystemTargetId,
              (typeof SYSTEM_TARGETS)[SystemTargetId],
            ][]
          ).map(([id, info]) => (
            <button
              key={id}
              onClick={() =>
                setConfig({
                  ...config,
                  primaryTarget: id,
                  secondaryTargets: (config.secondaryTargets || []).filter(
                    (t) => t !== id,
                  ),
                })
              }
              className={`p-3 rounded-lg border text-left transition ${
                config.primaryTarget === id
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-600 bg-slate-700 hover:border-gray-500"
              }`}
            >
              <div className="text-2xl mb-1">{info.icon}</div>
              <div className="text-sm text-white font-medium">{info.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-300 mb-3">
          Secondary Targets (30% of attacks, select up to 2)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            Object.entries(SYSTEM_TARGETS) as [
              SystemTargetId,
              (typeof SYSTEM_TARGETS)[SystemTargetId],
            ][]
          ).map(([id, info]) => {
            const isSelected = (config.secondaryTargets || []).includes(id);
            const isPrimary = config.primaryTarget === id;
            const isDisabled =
              isPrimary ||
              (!isSelected && (config.secondaryTargets || []).length >= 2);

            return (
              <button
                key={id}
                onClick={() => !isDisabled && toggleSecondaryTarget(id)}
                disabled={isDisabled}
                className={`p-3 rounded-lg border text-left transition ${
                  isPrimary
                    ? "border-gray-700 bg-slate-800 opacity-50 cursor-not-allowed"
                    : isSelected
                      ? "border-green-500 bg-green-500/20"
                      : isDisabled
                        ? "border-gray-700 bg-slate-700 opacity-50 cursor-not-allowed"
                        : "border-gray-600 bg-slate-700 hover:border-gray-500"
                }`}
              >
                <div className="text-2xl mb-1">{info.icon}</div>
                <div className="text-sm text-white font-medium">
                  {info.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step 3: Resource Attack
function Step3ResourceAttack({ config, setConfig }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">
        Resource Exploitation
      </h2>

      <div className="mb-6">
        <label className="block text-gray-300 mb-3">Attack Type</label>
        <div className="grid grid-cols-2 gap-3">
          {(
            Object.entries(RESOURCE_ATTACKS) as [
              ResourceAttackType,
              (typeof RESOURCE_ATTACKS)[ResourceAttackType],
            ][]
          ).map(([type, info]) => (
            <button
              key={type}
              onClick={() => setConfig({ ...config, resourceAttack: type })}
              className={`p-4 rounded-lg border-2 text-left transition ${
                config.resourceAttack === type
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-600 bg-slate-700 hover:border-gray-500"
              }`}
            >
              <div className="text-3xl mb-2">{info.icon}</div>
              <div className="text-white font-semibold">{info.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-300 mb-3">
          Damage Multiplier: {config.damageMultiplier?.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={config.damageMultiplier || 1.0}
          onChange={(e) =>
            setConfig({
              ...config,
              damageMultiplier: parseFloat(e.target.value),
            })
          }
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>Slow & Stealthy</span>
          <span>Fast & Destructive</span>
        </div>
      </div>
    </div>
  );
}

// Step 4: Victory Condition
function Step4VictoryCondition({ config, setConfig }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Victory Condition</h2>

      <div className="space-y-3">
        {(
          Object.entries(VICTORY_CONDITIONS) as [
            VictoryCondition,
            (typeof VICTORY_CONDITIONS)[VictoryCondition],
          ][]
        ).map(([condition, info]) => (
          <button
            key={condition}
            onClick={() =>
              setConfig({ ...config, victoryCondition: condition })
            }
            className={`w-full p-5 rounded-lg border-2 text-left transition ${
              config.victoryCondition === condition
                ? "border-purple-500 bg-purple-500/20"
                : "border-gray-600 bg-slate-700 hover:border-gray-500"
            }`}
          >
            <div className="text-white font-semibold text-lg mb-2">
              {info.name}
            </div>
            <div className="text-gray-400">{info.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 5: Abilities
function Step5Abilities({ config, setConfig }: StepProps) {
  const toggleAbility = (ability: SpecialAbility) => {
    const current = config.abilities || [];
    if (current.includes(ability)) {
      setConfig({ ...config, abilities: current.filter((a) => a !== ability) });
    } else if (current.length < 2) {
      setConfig({ ...config, abilities: [...current, ability] });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Special Abilities</h2>
      <p className="text-gray-400 mb-6">Select up to 2 abilities</p>

      <div className="grid grid-cols-1 gap-3">
        {(
          Object.entries(SPECIAL_ABILITIES) as [
            SpecialAbility,
            (typeof SPECIAL_ABILITIES)[SpecialAbility],
          ][]
        ).map(([ability, info]) => {
          const isSelected = (config.abilities || []).includes(ability);
          const isDisabled =
            !isSelected && (config.abilities || []).length >= 2;

          return (
            <button
              key={ability}
              onClick={() => !isDisabled && toggleAbility(ability)}
              disabled={isDisabled}
              className={`p-4 rounded-lg border-2 text-left transition ${
                isSelected
                  ? "border-green-500 bg-green-500/20"
                  : isDisabled
                    ? "border-gray-700 bg-slate-700 opacity-50 cursor-not-allowed"
                    : "border-gray-600 bg-slate-700 hover:border-gray-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{info.icon}</div>
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">
                    {info.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {info.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 6: Threat Pattern
function Step6ThreatPattern({ config, setConfig }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Threat Pattern</h2>

      <div className="mb-6">
        <label className="block text-gray-300 mb-3">
          Threat Count: {config.threatCount}
        </label>
        <input
          type="range"
          min="3"
          max="8"
          value={config.threatCount || 5}
          onChange={(e) =>
            setConfig({ ...config, threatCount: parseInt(e.target.value) })
          }
          className="w-full"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-300 mb-3">Spawn Pattern</label>
        <div className="space-y-2">
          {(
            Object.entries(SPAWN_PATTERNS) as [
              keyof typeof SPAWN_PATTERNS,
              (typeof SPAWN_PATTERNS)[keyof typeof SPAWN_PATTERNS],
            ][]
          ).map(([pattern, info]) => (
            <button
              key={pattern}
              onClick={() =>
                setConfig({ ...config, spawnPattern: pattern as any })
              }
              className={`w-full p-4 rounded-lg border-2 text-left transition ${
                config.spawnPattern === pattern
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-600 bg-slate-700 hover:border-gray-500"
              }`}
            >
              <div className="text-white font-semibold mb-1">{info.name}</div>
              <div className="text-sm text-gray-400">{info.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-300 mb-3">Skill Diversity</label>
        <div className="space-y-2">
          {(
            Object.entries(SKILL_DIVERSITY) as [
              keyof typeof SKILL_DIVERSITY,
              (typeof SKILL_DIVERSITY)[keyof typeof SKILL_DIVERSITY],
            ][]
          ).map(([diversity, info]) => (
            <button
              key={diversity}
              onClick={() =>
                setConfig({ ...config, skillDiversity: diversity as any })
              }
              className={`w-full p-4 rounded-lg border-2 text-left transition ${
                config.skillDiversity === diversity
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-600 bg-slate-700 hover:border-gray-500"
              }`}
            >
              <div className="text-white font-semibold mb-1">{info.name}</div>
              <div className="text-sm text-gray-400">{info.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  config: Partial<BotConfig>;
  setConfig: (config: Partial<BotConfig>) => void;
}
