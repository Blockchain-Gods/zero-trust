"use client";

import { RefreshCw, Medal } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  AnimatedTable,
  type ColumnDef,
  type SortDirection,
} from "@/components/ui/animated-table";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useWallet } from "@/hooks/useWallet";
import AccuracyBadge from "@/components/leaderboard-page/accuracy-badge";
import PlayerCell from "@/components/leaderboard-page/player-cell";
import RankDisplay from "@/components/leaderboard-page/rank-display";
import ScoreBar from "@/components/leaderboard-page/score-bar";
import ZKBadge from "@/components/leaderboard-page/zk-badge";
import { formatDuration } from "@/lib/utils";
import Stat from "@/components/leaderboard-page/stat";

export default function LeaderboardPage() {
  const { fetchTopScores, fetchPersonalBest, topScores, personalBest } =
    useLeaderboard();
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | undefined>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    await Promise.all([fetchTopScores(), fetchPersonalBest()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const rankedRows = useMemo(() => {
    return [...topScores]
      .sort((a, b) => b.score - a.score)
      .map((row, i) => ({ ...row, id: row.player, rank: i + 1 }));
  }, [topScores]);

  const maxScore = useMemo(
    () => Math.max(...rankedRows.map((r) => r.score), 1),
    [rankedRows],
  );

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return rankedRows;
    return [...rankedRows].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortColumn) {
        case "rank":
          aVal = a.rank;
          bVal = b.rank;
          break;
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "score":
          aVal = a.score;
          bVal = b.score;
          break;
        case "threats_cured":
          aVal = a.threats_cured;
          bVal = b.threats_cured;
          break;
        case "accuracy":
          aVal = a.accuracy_bps;
          bVal = b.accuracy_bps;
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [rankedRows, sortColumn, sortDirection]);

  type RankedRow = (typeof rankedRows)[number];

  const columns: ColumnDef<RankedRow>[] = [
    {
      id: "rank",
      header: "#",
      sortable: true,
      align: "center",
      cell: (row) => <RankDisplay rank={row.rank} />,
    },
    {
      id: "name",
      header: "player",
      sortable: true,
      cell: (row) => (
        <PlayerCell
          name={row.name}
          player={row.player}
          currentPlayer={wallet?.publicKey}
        />
      ),
    },
    {
      id: "score",
      header: "score",
      sortable: true,
      cell: (row) => <ScoreBar score={row.score} max={maxScore} />,
    },
    {
      id: "threats_cured",
      header: "cured",
      sortable: true,
      align: "center",
      cell: (row) => (
        <span className="font-mono text-green-400 text-sm tabular-nums">
          {row.threats_cured}
        </span>
      ),
    },
    {
      id: "accuracy",
      header: "accuracy",
      sortable: true,
      align: "center",
      cell: (row) => <AccuracyBadge bps={row.accuracy_bps} />,
    },
    {
      id: "verified",
      header: "proof",
      align: "center",
      cell: () => <ZKBadge />,
    },
  ];

  return (
    <div
      className="min-h-screen bg-stone-950 text-white"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm text-stone-600 uppercase tracking-widest">
              zero-trust
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-amber-400">
              leaderboard
            </h1>
            <p className="text-sm text-stone-500">
              verified on-chain · risc zero zk proofs · stellar testnet
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-stone-800 text-stone-600 text-sm font-mono hover:border-stone-700 hover:text-stone-400 transition-colors disabled:opacity-30"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "fetching..." : "refresh"}
          </button>
        </div>

        {/* Personal best */}
        {personalBest && (
          <div className="border border-stone-800 bg-stone-900/50">
            <div className="px-4 py-2 border-b border-stone-800 flex items-center gap-2">
              <Medal className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm text-stone-500 uppercase tracking-widest">
                your personal best
              </span>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <Stat
                label="score"
                value={personalBest.score.toLocaleString()}
                accent
              />
              <Stat
                label="accuracy"
                value={`${(personalBest.accuracy_bps / 100).toFixed(0)}%`}
              />
              <Stat label="cured" value={String(personalBest.threats_cured)} />
              <Stat
                label="duration"
                value={formatDuration(personalBest.duration_ms)}
              />
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-stone-700">
            <div className="h-5 w-5 border border-stone-800 border-t-stone-600 rounded-full animate-spin" />
            <span className="text-sm">fetching scores...</span>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-2 text-stone-700 text-center">
            <span className="text-4xl font-mono">[ ]</span>
            <p className="text-sm mt-2">no scores submitted yet</p>
            <p className="text-sm text-stone-800">
              be the first to submit a zk-verified score
            </p>
          </div>
        ) : (
          <AnimatedTable
            data={sortedData}
            columns={columns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={(col, dir) => {
              setSortColumn(col);
              setSortDirection(dir);
            }}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-stone-800 pt-4 border-t border-stone-900">
          <span>scores cannot be fabricated — cryptographically verified</span>
          <span>top 20</span>
        </div>
      </div>
    </div>
  );
}
