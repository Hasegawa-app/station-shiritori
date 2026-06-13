"use client";

import { useEffect, useMemo, useState } from "react";
import stationsJson from "@/data/stations.json";
import { judgeStation, Station } from "@/lib/station";

type Player = {
  id: number;
  name: string;
  timeLeft: number;
  alive: boolean;
  color: string;
};

type UsedStation = {
  station: Station;
  playerName: string;
  playerColor: string;
};

const INITIAL_TIME = 60;

const PLAYER_COLORS = ["#ef4444", "#3b82f6", "#facc15", "#22c55e"];

const stations = stationsJson as Station[];

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    timeLeft: INITIAL_TIME,
    alive: true,
    color: PLAYER_COLORS[i],
  }));
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function findNextAliveIndex(players: Player[], currentIndex: number) {
  for (let i = 1; i <= players.length; i++) {
    const nextIndex = (currentIndex + i) % players.length;
    if (players[nextIndex].alive) return nextIndex;
  }

  return currentIndex;
}

function getNextHeadsText(head: string) {
  const groups: Record<string, string[]> = {
    か: ["か", "が"],
    が: ["か", "が"],
    き: ["き", "ぎ"],
    ぎ: ["き", "ぎ"],
    く: ["く", "ぐ"],
    ぐ: ["く", "ぐ"],
    け: ["け", "げ"],
    げ: ["け", "げ"],
    こ: ["こ", "ご"],
    ご: ["こ", "ご"],

    さ: ["さ", "ざ"],
    ざ: ["さ", "ざ"],
    し: ["し", "じ"],
    じ: ["し", "じ"],
    す: ["す", "ず"],
    ず: ["す", "ず"],
    せ: ["せ", "ぜ"],
    ぜ: ["せ", "ぜ"],
    そ: ["そ", "ぞ"],
    ぞ: ["そ", "ぞ"],

    た: ["た", "だ"],
    だ: ["た", "だ"],
    ち: ["ち", "ぢ"],
    ぢ: ["ち", "ぢ"],
    つ: ["つ", "づ"],
    づ: ["つ", "づ"],
    て: ["て", "で"],
    で: ["て", "で"],
    と: ["と", "ど"],
    ど: ["と", "ど"],

    は: ["は", "ば", "ぱ"],
    ば: ["は", "ば", "ぱ"],
    ぱ: ["は", "ば", "ぱ"],
    ひ: ["ひ", "び", "ぴ"],
    び: ["ひ", "び", "ぴ"],
    ぴ: ["ひ", "び", "ぴ"],
    ふ: ["ふ", "ぶ", "ぷ"],
    ぶ: ["ふ", "ぶ", "ぷ"],
    ぷ: ["ふ", "ぶ", "ぷ"],
    へ: ["へ", "べ", "ぺ"],
    べ: ["へ", "べ", "ぺ"],
    ぺ: ["へ", "べ", "ぺ"],
    ほ: ["ほ", "ぼ", "ぽ"],
    ぼ: ["ほ", "ぼ", "ぽ"],
    ぽ: ["ほ", "ぼ", "ぽ"],
  };

  return groups[head]?.join(" / ") ?? head;
}

export default function Home() {
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>(makePlayers(2));
  const [turnIndex, setTurnIndex] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [requiredHead, setRequiredHead] = useState<string | null>(null);
  const [usedStations, setUsedStations] = useState<UsedStation[]>([]);
  const [message, setMessage] = useState("開始を押して駅名を入力");

  const currentPlayer = players[turnIndex];

  const validUsedStations = useMemo(
    () => usedStations.filter(item => item.station),
    [usedStations]
  );

  const usedStationIds = useMemo(
    () => validUsedStations.map(item => item.station.id),
    [validUsedStations]
  );

  useEffect(() => {
    if (!isRunning || winner) return;

    const timer = setInterval(() => {
      setPlayers(prev => {
        const next = prev.map(player => ({ ...player }));
        const current = next[turnIndex];

        if (!current || !current.alive) return next;

        if (current.timeLeft <= 1) {
          current.timeLeft = 0;
          current.alive = false;

          const alivePlayers = next.filter(player => player.alive);

          if (alivePlayers.length === 1) {
            setWinner(alivePlayers[0].name);
            setIsRunning(false);
            setMessage(`${current.name} が時間切れ。${alivePlayers[0].name} の勝ち`);
          } else {
            setTurnIndex(findNextAliveIndex(next, turnIndex));
            setMessage(`${current.name} が時間切れで脱落`);
          }

          return next;
        }

        current.timeLeft -= 1;
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, turnIndex, winner]);

  function changePlayerCount(count: number) {
    setPlayerCount(count);
    setPlayers(makePlayers(count));
    setTurnIndex(0);
    setIsRunning(false);
    setWinner(null);
    setInput("");
    setRequiredHead(null);
    setUsedStations([]);
    setMessage("開始を押して駅名を入力");
  }

  function resetGame() {
    setPlayers(makePlayers(playerCount));
    setTurnIndex(0);
    setIsRunning(false);
    setWinner(null);
    setInput("");
    setRequiredHead(null);
    setUsedStations([]);
    setMessage("開始を押して駅名を入力");
  }

  function loseCurrentPlayer(reason: string) {
    setPlayers(prev => {
      const next = prev.map(player => ({ ...player }));
      next[turnIndex].alive = false;

      const alivePlayers = next.filter(player => player.alive);

      if (alivePlayers.length === 1) {
        setWinner(alivePlayers[0].name);
        setIsRunning(false);
        setMessage(`${reason}${alivePlayers[0].name} の勝ち`);
      } else {
        setTurnIndex(findNextAliveIndex(next, turnIndex));
        setMessage(reason);
      }

      return next;
    });
  }

  function submitStation() {
    if (!isRunning) {
      setMessage("先に開始を押してください");
      return;
    }

    if (winner || !currentPlayer?.alive) return;

    const result = judgeStation({
      input,
      stations,
      usedStationIds,
      requiredHead,
    });

    if (!result.ok) {
      setMessage(result.reason);

      if (result.lose) {
        loseCurrentPlayer(`${currentPlayer.name} が脱落。`);
        setInput("");
      }

      return;
    }

    const nextTurn = findNextAliveIndex(players, turnIndex);
    const nextHeadsText = getNextHeadsText(result.nextHead);

    setUsedStations(prev => [
      ...prev,
      {
        station: result.station,
        playerName: currentPlayer.name,
        playerColor: currentPlayer.color,
      },
    ]);

    setRequiredHead(result.nextHead);
    setInput("");
    setTurnIndex(nextTurn);
    setMessage(
      `${currentPlayer.name}: ${result.station.name} OK。次は「${nextHeadsText}」`
    );
  }

  return (
    <main style={styles.main}>
      <h1>駅名しりとり 対人戦</h1>

      <div style={styles.controls}>
        {[2, 3, 4].map(count => (
          <button
            key={count}
            onClick={() => changePlayerCount(count)}
            style={{
              ...styles.smallButton,
              backgroundColor: playerCount === count ? "#222" : "#eee",
              color: playerCount === count ? "#fff" : "#222",
            }}
          >
            {count}人
          </button>
        ))}
      </div>

      <div style={styles.board}>
        {players.map((player, index) => {
          const active = index === turnIndex && isRunning && player.alive;

          return (
            <div
              key={player.id}
              style={{
                ...styles.playerCard,
                opacity: player.alive ? 1 : 0.35,
                border: active
                  ? `5px solid ${player.color}`
                  : `3px solid ${player.color}`,
                boxShadow: active ? `0 0 18px ${player.color}` : "none",
                transform: active ? "scale(1.04)" : "scale(1)",
              }}
            >
              <div
                style={{
                  ...styles.colorBar,
                  backgroundColor: player.color,
                }}
              />

              <div style={styles.playerName}>{player.name}</div>
              <div style={styles.time}>{formatTime(player.timeLeft)}</div>
              {active && <div style={styles.turnLabel}>あなたのターン</div>}
              {!player.alive && <div style={styles.turnLabel}>脱落</div>}
            </div>
          );
        })}
      </div>

      <div style={styles.status}>
        {winner
          ? `勝者：${winner}`
          : isRunning
          ? `${currentPlayer.name} の番`
          : "停止中"}
      </div>

      <div style={styles.nextHead}>
        {requiredHead
          ? `次は「${getNextHeadsText(requiredHead)}」`
          : "最初の駅は自由"}
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          submitStation();
        }}
        style={styles.form}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            requiredHead
              ? `「${getNextHeadsText(requiredHead)}」から始まる駅名`
              : "駅名を入力"
          }
          style={styles.input}
          disabled={!isRunning || !!winner}
        />

        <button
          type="submit"
          style={styles.submitButton}
          disabled={!isRunning || !!winner}
        >
          確定
        </button>
      </form>

      <p style={styles.message}>{message}</p>

      <div style={styles.controls}>
        <button
          onClick={() => {
            if (!winner) {
              setIsRunning(true);
              setMessage(`${currentPlayer.name} の番`);
            }
          }}
          style={styles.smallButton}
        >
          開始
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            setMessage("一時停止中");
          }}
          style={styles.smallButton}
        >
          一時停止
        </button>

        <button onClick={resetGame} style={styles.smallButton}>
          リセット
        </button>
      </div>

      <section style={styles.history}>
        <h2>使用済み駅</h2>

        {validUsedStations.length === 0 ? (
          <p>まだありません</p>
        ) : (
          <ol style={styles.historyList}>
            {validUsedStations.map((item, index) => (
              <li
                key={`${item.station.id}-${index}`}
                style={styles.historyItem}
              >
                <span
                  style={{
                    ...styles.playerColorBox,
                    backgroundColor: item.playerColor,
                  }}
                />
                <span>
                  {item.station.name}
                  {item.station.line ? ` / ${item.station.line}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    padding: 24,
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    margin: "16px 0",
    flexWrap: "wrap",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(140px, 1fr))",
    gap: 16,
    maxWidth: 640,
    margin: "24px auto",
  },
  playerCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#f7f7f7",
    transition: "0.15s",
  },
  colorBar: {
    height: 10,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  playerName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 6,
  },
  time: {
    fontSize: 48,
    fontWeight: "bold",
    marginTop: 8,
  },
  turnLabel: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
  },
  status: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
  },
  nextHead: {
    fontSize: 22,
    margin: "12px 0",
  },
  form: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    flexWrap: "wrap",
  },
  input: {
    fontSize: 24,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #aaa",
    width: 320,
  },
  submitButton: {
    fontSize: 24,
    fontWeight: "bold",
    padding: "12px 28px",
    borderRadius: 14,
    border: "none",
    backgroundColor: "#222",
    color: "#fff",
    cursor: "pointer",
  },
  smallButton: {
    fontSize: 18,
    padding: "10px 18px",
    borderRadius: 12,
    border: "1px solid #aaa",
    cursor: "pointer",
  },
  message: {
    fontSize: 18,
    minHeight: 28,
  },
  history: {
    maxWidth: 560,
    margin: "32px auto",
    textAlign: "left",
  },
  historyList: {
    paddingLeft: 24,
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  playerColorBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    display: "inline-block",
    flexShrink: 0,
  },
};