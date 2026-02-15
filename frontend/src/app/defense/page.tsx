"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Threat, Developer, DefenseGameState } from "@/lib/defense-types";
import { BotConfig } from "@/lib/types";
import { getAllBots } from "@/lib/storage";
import {
  generateThreatsFromBot,
  generateDevelopers,
  calculateCureSpeed,
  getMatchQuality,
  calculateScore,
} from "@/lib/game-logic";

const ROUND_DURATION = 90; // seconds

export default function DefensePage() {
  const router = useRouter();
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null);
  const [gameState, setGameState] = useState<DefenseGameState | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load available bots
  const [bots, setBots] = useState<BotConfig[]>([]);
  useEffect(() => {
    const loadedBots = getAllBots();
    setBots(loadedBots);
    if (loadedBots.length > 0) {
      setSelectedBot(loadedBots[0]);
    }
  }, []);

  const startGame = () => {
    if (!selectedBot) return;

    const threats = generateThreatsFromBot(selectedBot);
    const developers = generateDevelopers();

    setGameState({
      isPlaying: true,
      isPaused: false,
      timeRemaining: ROUND_DURATION,
      threats,
      developers,
      systemsDestroyed: 0,
      threatsCured: 0,
      score: 0,
      startTime: Date.now(),
    });

    setShowGameOver(false);
  };

  // Game loop
  useEffect(() => {
    if (!gameState?.isPlaying || gameState.isPaused) return;

    intervalRef.current = setInterval(() => {
      setGameState((prevState) => {
        if (!prevState) return null;

        const elapsed = (Date.now() - (prevState.startTime || 0)) / 1000;
        const newTimeRemaining = Math.max(0, ROUND_DURATION - elapsed);

        // Update threats
        const updatedThreats = prevState.threats.map((threat) => {
          if (threat.isCured || threat.isFailed) return threat;

          // Check if threat should spawn
          if (threat.spawnTime > elapsed) return threat;

          let newDamage = threat.currentDamage;
          let newCureProgress = threat.cureProgress;

          // Apply damage if not cured
          if (!threat.assignedDeveloperId) {
            newDamage += threat.damageRate / 10; // Update every 100ms
          }

          // Apply cure if developer assigned
          if (threat.assignedDeveloperId) {
            const dev = prevState.developers.find(
              (d) => d.id === threat.assignedDeveloperId,
            );
            if (dev) {
              const cureSpeed = calculateCureSpeed(threat, dev);
              newCureProgress += cureSpeed / 10; // Update every 100ms
            }
          }

          // Check if cured
          if (newCureProgress >= 100) {
            return { ...threat, isCured: true, cureProgress: 100 };
          }

          // Check if failed
          if (newDamage >= 100) {
            return { ...threat, isFailed: true, currentDamage: 100 };
          }

          return {
            ...threat,
            currentDamage: Math.min(100, newDamage),
            cureProgress: Math.min(100, newCureProgress),
          };
        });

        // Count results
        const cured = updatedThreats.filter((t) => t.isCured).length;
        const destroyed = updatedThreats.filter((t) => t.isFailed).length;

        // Check game over
        if (
          newTimeRemaining <= 0 ||
          updatedThreats.every((t) => t.isCured || t.isFailed)
        ) {
          setShowGameOver(true);
          return {
            ...prevState,
            isPlaying: false,
            timeRemaining: newTimeRemaining,
            threats: updatedThreats,
            threatsCured: cured,
            systemsDestroyed: destroyed,
            score: calculateScore(cured, destroyed, newTimeRemaining),
          };
        }

        return {
          ...prevState,
          timeRemaining: newTimeRemaining,
          threats: updatedThreats,
          threatsCured: cured,
          systemsDestroyed: destroyed,
          score: calculateScore(cured, destroyed, newTimeRemaining),
        };
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState?.isPlaying, gameState?.isPaused]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !gameState) return;

    const developerId = active.id as string;
    const threatId = over.id as string;

    setGameState((prevState) => {
      if (!prevState) return null;

      // Unassign developer from previous threat
      const updatedThreats = prevState.threats.map((t) => {
        if (t.assignedDeveloperId === developerId) {
          return { ...t, assignedDeveloperId: null };
        }
        if (t.id === threatId && !t.isCured && !t.isFailed) {
          return { ...t, assignedDeveloperId: developerId };
        }
        return t;
      });

      const updatedDevelopers = prevState.developers.map((d) => {
        if (d.id === developerId) {
          return { ...d, isAssigned: true, assignedToThreatId: threatId };
        }
        return d;
      });

      return {
        ...prevState,
        threats: updatedThreats,
        developers: updatedDevelopers,
      };
    });
  };

  const handleUnassign = (developerId: string) => {
    setGameState((prevState) => {
      if (!prevState) return null;

      const updatedThreats = prevState.threats.map((t) => {
        if (t.assignedDeveloperId === developerId) {
          return { ...t, assignedDeveloperId: null };
        }
        return t;
      });

      const updatedDevelopers = prevState.developers.map((d) => {
        if (d.id === developerId) {
          return { ...d, isAssigned: false, assignedToThreatId: null };
        }
        return d;
      });

      return {
        ...prevState,
        threats: updatedThreats,
        developers: updatedDevelopers,
      };
    });
  };

  if (!gameState || !gameState.isPlaying) {
    return (
      <BotSelectionScreen
        bots={bots}
        selectedBot={selectedBot}
        onSelectBot={setSelectedBot}
        onStart={startGame}
        onBack={() => router.push("/")}
      />
    );
  }

  const activeThreats = gameState.threats.filter(
    (t) =>
      t.spawnTime <= ROUND_DURATION - gameState.timeRemaining &&
      !t.isCured &&
      !t.isFailed,
  );

  const activeDeveloper = activeDragId
    ? gameState.developers.find((d) => d.id === activeDragId)
    : null;

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={(e) => setActiveDragId(e.active.id as string)}
    >
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-red-900 to-slate-900 p-4">
        {/* HUD */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-slate-800/90 rounded-lg p-4 flex justify-between items-center">
            <div className="flex gap-6">
              <div>
                <div className="text-sm text-gray-400">Time</div>
                <div className="text-2xl font-bold text-white">
                  {Math.floor(gameState.timeRemaining)}s
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Cured</div>
                <div className="text-2xl font-bold text-green-400">
                  {gameState.threatsCured}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Destroyed</div>
                <div className="text-2xl font-bold text-red-400">
                  {gameState.systemsDestroyed}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Score</div>
              <div className="text-2xl font-bold text-purple-400">
                {gameState.score}
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Threats Panel */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xl font-bold text-white mb-2">
              Active Threats
            </h2>
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {activeThreats.map((threat) => (
                <ThreatCard
                  key={threat.id}
                  threat={threat}
                  developer={gameState.developers.find(
                    (d) => d.id === threat.assignedDeveloperId,
                  )}
                  onUnassign={handleUnassign}
                />
              ))}
              {activeThreats.length === 0 && (
                <div className="bg-slate-800 rounded-lg p-8 text-center">
                  <div className="text-gray-400">
                    Waiting for threats to spawn...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Developers Panel */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white mb-2">Developers</h2>
            <div className="space-y-2">
              {gameState.developers.map((dev) => (
                <DeveloperCard key={dev.id} developer={dev} />
              ))}
            </div>
          </div>
        </div>

        {/* Game Over Modal */}
        {showGameOver && (
          <GameOverModal
            gameState={gameState}
            onRestart={startGame}
            onExit={() => router.push("/")}
          />
        )}
      </div>

      <DragOverlay>
        {activeDeveloper && (
          <div className="bg-slate-700 rounded-lg p-3 border-2 border-purple-500 shadow-2xl opacity-90">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeDeveloper.avatar}</span>
              <span className="text-white font-semibold">
                {activeDeveloper.name}
              </span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Threat Card Component
function ThreatCard({
  threat,
  developer,
  onUnassign,
}: {
  threat: Threat;
  developer?: Developer;
  onUnassign: (devId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: threat.id,
    data: { threat },
  });

  const damagePercent = Math.min(100, threat.currentDamage);
  const curePercent = Math.min(100, threat.cureProgress);

  const matchQuality = developer ? getMatchQuality(threat, developer) : null;

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-800 rounded-lg p-4 border-2 transition ${
        isOver
          ? "border-purple-500 scale-105"
          : threat.assignedDeveloperId
            ? "border-blue-500"
            : "border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{threat.target.icon}</span>
          <div>
            <h3 className="text-white font-semibold">{threat.target.name}</h3>
            <div className="text-xs text-gray-400">
              Threat #{threat.id.split("-")[1]}
            </div>
          </div>
        </div>
        {developer && matchQuality && (
          <div className={`text-xs font-semibold ${matchQuality.color}`}>
            {matchQuality.label}
          </div>
        )}
      </div>

      {/* Required Skills */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">Required Skills:</div>
        <div className="flex gap-1 flex-wrap">
          {threat.requiredSkills.map((skill) => (
            <span
              key={skill.id}
              className={`px-2 py-1 rounded text-xs ${
                developer?.skills.some((s) => s.id === skill.id)
                  ? "bg-green-500/20 text-green-300 border border-green-500"
                  : "bg-slate-700 text-gray-300"
              }`}
            >
              {skill.icon} {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Damage Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-400">Damage</span>
          <span className="text-red-400 font-semibold">
            {damagePercent.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              damagePercent > 70
                ? "bg-red-500 animate-pulse"
                : damagePercent > 30
                  ? "bg-orange-500"
                  : "bg-yellow-500"
            }`}
            style={{ width: `${damagePercent}%` }}
          />
        </div>
      </div>

      {/* Cure Progress */}
      {developer && (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-400">Cure Progress</span>
              <span className="text-blue-400 font-semibold">
                {curePercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${curePercent}%` }}
              />
            </div>
          </div>

          {/* Assigned Developer */}
          <div className="flex items-center justify-between bg-slate-700 rounded p-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{developer.avatar}</span>
              <span className="text-sm text-white">{developer.name}</span>
            </div>
            <button
              onClick={() => onUnassign(developer.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Unassign
            </button>
          </div>
        </>
      )}

      {!developer && (
        <div className="text-center text-sm text-gray-400 py-2 border-2 border-dashed border-gray-600 rounded">
          Drag developer here
        </div>
      )}
    </div>
  );
}

// Developer Card Component
function DeveloperCard({ developer }: { developer: Developer }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: developer.id,
      data: { developer },
      disabled: developer.isAssigned,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-slate-800 rounded-lg p-3 border-2 transition ${
        developer.isAssigned
          ? "border-gray-700 opacity-50"
          : isDragging
            ? "border-purple-500 opacity-50"
            : "border-gray-600 hover:border-purple-400 cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{developer.avatar}</span>
        <span className="text-white font-semibold">{developer.name}</span>
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

// Bot Selection Screen
function BotSelectionScreen({
  bots,
  selectedBot,
  onSelectBot,
  onStart,
  onBack,
}: {
  bots: BotConfig[];
  selectedBot: BotConfig | null;
  onSelectBot: (bot: BotConfig) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  if (bots.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-8">
        <div className="bg-slate-800 rounded-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">🛡️</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            No Bots Available
          </h2>
          <p className="text-gray-400 mb-6">
            Create some attack bots first, then come back to defend against
            them!
          </p>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition"
          >
            Go Create Bots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-red-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
        >
          ← Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Defense Mode</h1>
          <p className="text-gray-400">Select a bot to defend against</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {bots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => onSelectBot(bot)}
              className={`bg-slate-800 rounded-lg p-6 text-left border-2 transition ${
                selectedBot?.id === bot.id
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {bot.botName}
              </h3>
              <div className="text-sm text-gray-400 mb-3">{bot.botType}</div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Threats:</span>{" "}
                  <span className="text-white font-semibold">
                    {bot.threatCount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Difficulty:</span>{" "}
                  <span className="text-white font-semibold capitalize">
                    {bot.skillDiversity}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedBot && (
          <div className="text-center">
            <button
              onClick={onStart}
              className="px-12 py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-500 transition animate-pulse"
            >
              🛡️ Start Defense Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Game Over Modal
function GameOverModal({
  gameState,
  onRestart,
  onExit,
}: {
  gameState: DefenseGameState;
  onRestart: () => void;
  onExit: () => void;
}) {
  const totalThreats = gameState.threats.length;
  const successRate = (gameState.threatsCured / totalThreats) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Round Complete!
        </h2>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Threats Cured</span>
            <span className="text-2xl font-bold text-green-400">
              {gameState.threatsCured} / {totalThreats}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Systems Destroyed</span>
            <span className="text-2xl font-bold text-red-400">
              {gameState.systemsDestroyed}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Success Rate</span>
            <span className="text-2xl font-bold text-purple-400">
              {successRate.toFixed(0)}%
            </span>
          </div>
          <div className="pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Final Score</span>
              <span className="text-3xl font-bold text-white">
                {gameState.score}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition"
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
