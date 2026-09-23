import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Crosshair,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  Play,
  Pause,
  Bot,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { EmployeePlayer, RoundTarget, ShotVisual, HitParticle } from '../types/doge';
import { sound } from '../utils/audio';

interface ShootoutArenaProps {
  employees: EmployeePlayer[];
  coreVaultBalance: number;
  gameWalletAddress: string;
  isCoreConnected: boolean;
  onPayoutComplete: (data: any) => void;
  onRefreshState: () => void;
}

const PLAYER_COLORS = [
  { main: '#f59e0b', text: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-500/10', glow: 'rgba(245, 158, 11, 0.4)' },
  { main: '#38bdf8', text: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-500/10', glow: 'rgba(56, 189, 248, 0.4)' },
  { main: '#10b981', text: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500/10', glow: 'rgba(16, 185, 129, 0.4)' },
  { main: '#ec4899', text: 'text-pink-400', border: 'border-pink-500', bg: 'bg-pink-500/10', glow: 'rgba(236, 72, 153, 0.4)' },
];

export const ShootoutArena: React.FC<ShootoutArenaProps> = ({
  employees,
  coreVaultBalance,
  gameWalletAddress,
  isCoreConnected,
  onPayoutComplete,
  onRefreshState,
}) => {
  // 4 active player seats chosen from the 8 employees
  const [activeSeatIds, setActiveSeatIds] = useState<string[]>([
    'emp-1',
    'emp-2',
    'emp-3',
    'emp-4',
  ]);

  // Auto-fire bots for unoccupied seats or solo testing
  const [autoFire, setAutoFire] = useState<{ [key: string]: boolean }>({
    'emp-1': false,
    'emp-2': true,
    'emp-3': true,
    'emp-4': true,
  });

  // Current Round Data
  const [roundTarget, setRoundTarget] = useState<RoundTarget | null>(null);
  const [roundStatus, setRoundStatus] = useState<'idle' | 'aiming' | 'won' | 'payout_processing'>('idle');
  const [winner, setWinner] = useState<{ player: EmployeePlayer; amount: number; txid?: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [cooldowns, setCooldowns] = useState<{ [key: string]: boolean }>({});
  const [shotsFiredTotal, setShotsFiredTotal] = useState(0);

  // Canvas visual effects for shots and particle hits
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shotsRef = useRef<ShotVisual[]>([]);
  const particlesRef = useRef<HitParticle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const arenaBoxRef = useRef<HTMLDivElement | null>(null);

  // Sound toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  // Fetch or spawn a new target from Core
  const fetchNewTarget = async () => {
    try {
      setRoundStatus('idle');
      setWinner(null);
      sound.playBeep(true);

      const res = await fetch('/api/doge/round/new');
      if (!res.ok) throw new Error('Failed to generate target');
      const data = await res.json();

      setRoundTarget({
        roundNumber: data.roundNumber,
        bountyAmount: data.bountyAmount,
        targetAddress: data.targetAddress,
        addressSource: data.addressSource,
        gameWalletAddress: data.gameWalletAddress || gameWalletAddress,
        hp: 100,
        maxHp: 100,
      });

      setRoundStatus('aiming');
    } catch (err) {
      console.error('Target fetch error:', err);
      // Fallback
      setRoundTarget({
        roundNumber: 1,
        bountyAmount: Math.floor(10 + Math.random() * 490),
        targetAddress: 'DKJgjXzDiwv7U6y6pDtjBxRk3qWU9Ymck3',
        addressSource: 'local-fallback',
        gameWalletAddress,
        hp: 100,
        maxHp: 100,
      });
      setRoundStatus('aiming');
    }
  };

  // Initialize first target
  useEffect(() => {
    fetchNewTarget();
  }, []);

  // Quick Matchmaker: Rotate 4 players fairly among the 8 employees
  const rotatePlayers = () => {
    const allIds = employees.map((e) => e.id);
    const firstCurrentIndex = allIds.indexOf(activeSeatIds[0]);
    const nextIndex = (firstCurrentIndex + 4) % allIds.length;
    const next4 = [
      allIds[nextIndex],
      allIds[(nextIndex + 1) % allIds.length],
      allIds[(nextIndex + 2) % allIds.length],
      allIds[(nextIndex + 3) % allIds.length],
    ];
    setActiveSeatIds(next4);
  };

  const getSeatPlayer = (index: number): EmployeePlayer | undefined => {
    const id = activeSeatIds[index];
    return employees.find((e) => e.id === id);
  };

  // Particle emission when shot strikes Core
  const emitHitParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        maxLife: 1.0,
        size: 3 + Math.random() * 3,
      });
    }
  };

  // Trigger Shoot Action for a Seat Player
  const handleShoot = useCallback(
    async (seatIndex: number) => {
      if (roundStatus !== 'aiming' || !roundTarget || roundTarget.hp <= 0) return;

      const player = getSeatPlayer(seatIndex);
      if (!player) return;

      if (cooldowns[player.id]) return;

      // Set player cooldown (250ms rate limit)
      setCooldowns((prev) => ({ ...prev, [player.id]: true }));
      setTimeout(() => {
        setCooldowns((prev) => ({ ...prev, [player.id]: false }));
      }, 240);

      sound.playLaser(seatIndex);
      setShotsFiredTotal((c) => c + 1);

      // Calculate shot vectors relative to arena box
      if (arenaBoxRef.current) {
        const rect = arenaBoxRef.current.getBoundingClientRect();
        const targetX = rect.width / 2;
        const targetY = rect.height / 2;

        let startX = 0;
        let startY = 0;

        if (seatIndex === 0) {
          startX = 40;
          startY = 40;
        } else if (seatIndex === 1) {
          startX = rect.width - 40;
          startY = 40;
        } else if (seatIndex === 2) {
          startX = 40;
          startY = rect.height - 40;
        } else {
          startX = rect.width - 40;
          startY = rect.height - 40;
        }

        const color = PLAYER_COLORS[seatIndex]?.main || '#f59e0b';

        shotsRef.current.push({
          id: Math.random().toString(),
          playerId: player.id,
          playerIndex: seatIndex,
          startX,
          startY,
          targetX,
          targetY,
          color,
          timestamp: Date.now(),
        });

        // Trigger hit particles at core center
        emitHitParticles(targetX, targetY, color);
      }

      // Damage calculation: random pulse damage between 12 and 25
      const damage = Math.floor(14 + Math.random() * 12);
      const remainingHp = Math.max(0, roundTarget.hp - damage);

      sound.playHit();

      setRoundTarget((prev) => (prev ? { ...prev, hp: remainingHp } : null));

      // Core breached! Player wins the round and the DOGE bounty!
      if (remainingHp <= 0) {
        setRoundStatus('payout_processing');
        sound.playJackpot();

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#38bdf8', '#10b981'],
        });

        // Dispatch payout to Dogecoin Core / backend
        try {
          const res = await fetch('/api/doge/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: player.id,
              bountyAmount: roundTarget.bountyAmount,
              targetAddress: roundTarget.targetAddress,
            }),
          });
          const payoutData = await res.json();

          setWinner({
            player,
            amount: roundTarget.bountyAmount,
            txid: payoutData.tx?.txid,
          });
          setRoundStatus('won');
          onPayoutComplete(payoutData);
        } catch (err) {
          console.error('Payout failed:', err);
          setWinner({
            player,
            amount: roundTarget.bountyAmount,
          });
          setRoundStatus('won');
        }
      }
    },
    [roundStatus, roundTarget, cooldowns, activeSeatIds, employees]
  );

  // Bot Auto-Fire interval for active bots
  useEffect(() => {
    if (roundStatus !== 'aiming') return;

    const interval = setInterval(() => {
      activeSeatIds.forEach((id, seatIdx) => {
        if (autoFire[id]) {
          // Add small jitter so bots don't shoot in lockstep
          if (Math.random() > 0.45) {
            handleShoot(seatIdx);
          }
        }
      });
    }, 420);

    return () => clearInterval(interval);
  }, [roundStatus, activeSeatIds, autoFire, handleShoot]);

  // Keyboard shortcut listener for 4 players (Keys: 1/Q, 2/P, 3/Z, 4/M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (roundStatus !== 'aiming') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === '1' || key === 'q') {
        e.preventDefault();
        handleShoot(0);
      } else if (key === '2' || key === 'p') {
        e.preventDefault();
        handleShoot(1);
      } else if (key === '3' || key === 'z') {
        e.preventDefault();
        handleShoot(2);
      } else if (key === '4' || key === 'm') {
        e.preventDefault();
        handleShoot(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roundStatus, handleShoot]);

  // Canvas render loop for beam flashes and particle sparks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

      // Render Laser Beams
      shotsRef.current = shotsRef.current.filter((shot) => {
        const age = now - shot.timestamp;
        if (age > 200) return false;

        const alpha = Math.max(0, 1 - age / 200);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(shot.startX, shot.startY);
        ctx.lineTo(shot.targetX, shot.targetY);

        ctx.strokeStyle = shot.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = shot.color;
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Inner white beam core
        ctx.beginPath();
        ctx.moveTo(shot.startX, shot.startY);
        ctx.lineTo(shot.targetX, shot.targetY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.9;
        ctx.stroke();

        ctx.restore();
        return true;
      });

      // Render Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;

        if (p.life <= 0) return false;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();

        return true;
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (arenaBoxRef.current && canvasRef.current) {
        canvasRef.current.width = arenaBoxRef.current.clientWidth;
        canvasRef.current.height = arenaBoxRef.current.clientHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Top Arena Header: HUD & Matchmaking Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">Intranet Doge Arena</h2>
              <span className="text-xs text-slate-400 font-mono">
                Round #{roundTarget?.roundNumber || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              4 simultaneous employee stations · Fire when Core address appears!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Mute */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Quick Roster Rotation */}
          <button
            onClick={rotatePlayers}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
            title="Rotate to next 4 employees"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Rotate 4 Players</span>
          </button>

          {/* New Target / Reset */}
          <button
            onClick={fetchNewTarget}
            disabled={roundStatus === 'payout_processing'}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Target</span>
          </button>
        </div>
      </div>

      {/* Main Shootout Stage (2x2 Player Cockpit enclosing Central Core) */}
      <div
        ref={arenaBoxRef}
        className="relative w-full min-h-[500px] md:min-h-[540px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-4 md:p-6 flex items-center justify-center select-none"
      >
        {/* Particle and laser canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-20 pointer-events-none w-full h-full"
        />

        {/* Radar grid subtle background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-amber-500/20 rounded-full animate-pulse-ring" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-amber-500/30 rounded-full" />
        </div>

        {/* 4 Player Cockpit Stations (Positions: TL, TR, BL, BR) */}
        {/* Station 0: Top-Left */}
        <div className="absolute top-4 left-4 z-30 max-w-[210px] md:max-w-[240px]">
          <PlayerStationCard
            seatIndex={0}
            player={getSeatPlayer(0)}
            allEmployees={employees}
            colorStyle={PLAYER_COLORS[0]}
            shortcutKey="Q / 1"
            isAutoFire={autoFire[activeSeatIds[0]] || false}
            onToggleAutoFire={() =>
              setAutoFire((p) => ({ ...p, [activeSeatIds[0]]: !p[activeSeatIds[0]] }))
            }
            onSelectEmployee={(empId) => {
              const copy = [...activeSeatIds];
              copy[0] = empId;
              setActiveSeatIds(copy);
            }}
            onShoot={() => handleShoot(0)}
            isCooling={Boolean(cooldowns[activeSeatIds[0]])}
            disabled={roundStatus !== 'aiming'}
          />
        </div>

        {/* Station 1: Top-Right */}
        <div className="absolute top-4 right-4 z-30 max-w-[210px] md:max-w-[240px]">
          <PlayerStationCard
            seatIndex={1}
            player={getSeatPlayer(1)}
            allEmployees={employees}
            colorStyle={PLAYER_COLORS[1]}
            shortcutKey="P / 2"
            isAutoFire={autoFire[activeSeatIds[1]] || false}
            onToggleAutoFire={() =>
              setAutoFire((p) => ({ ...p, [activeSeatIds[1]]: !p[activeSeatIds[1]] }))
            }
            onSelectEmployee={(empId) => {
              const copy = [...activeSeatIds];
              copy[1] = empId;
              setActiveSeatIds(copy);
            }}
            onShoot={() => handleShoot(1)}
            isCooling={Boolean(cooldowns[activeSeatIds[1]])}
            disabled={roundStatus !== 'aiming'}
          />
        </div>

        {/* Station 2: Bottom-Left */}
        <div className="absolute bottom-4 left-4 z-30 max-w-[210px] md:max-w-[240px]">
          <PlayerStationCard
            seatIndex={2}
            player={getSeatPlayer(2)}
            allEmployees={employees}
            colorStyle={PLAYER_COLORS[2]}
            shortcutKey="Z / 3"
            isAutoFire={autoFire[activeSeatIds[2]] || false}
            onToggleAutoFire={() =>
              setAutoFire((p) => ({ ...p, [activeSeatIds[2]]: !p[activeSeatIds[2]] }))
            }
            onSelectEmployee={(empId) => {
              const copy = [...activeSeatIds];
              copy[2] = empId;
              setActiveSeatIds(copy);
            }}
            onShoot={() => handleShoot(2)}
            isCooling={Boolean(cooldowns[activeSeatIds[2]])}
            disabled={roundStatus !== 'aiming'}
          />
        </div>

        {/* Station 3: Bottom-Right */}
        <div className="absolute bottom-4 right-4 z-30 max-w-[210px] md:max-w-[240px]">
          <PlayerStationCard
            seatIndex={3}
            player={getSeatPlayer(3)}
            allEmployees={employees}
            colorStyle={PLAYER_COLORS[3]}
            shortcutKey="M / 4"
            isAutoFire={autoFire[activeSeatIds[3]] || false}
            onToggleAutoFire={() =>
              setAutoFire((p) => ({ ...p, [activeSeatIds[3]]: !p[activeSeatIds[3]] }))
            }
            onSelectEmployee={(empId) => {
              const copy = [...activeSeatIds];
              copy[3] = empId;
              setActiveSeatIds(copy);
            }}
            onShoot={() => handleShoot(3)}
            isCooling={Boolean(cooldowns[activeSeatIds[3]])}
            disabled={roundStatus !== 'aiming'}
          />
        </div>

        {/* CENTRAL CORE TARGET REACTOR */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
          {roundTarget ? (
            <div
              onClick={() => {
                // Clicking target directly shoots with player 0
                handleShoot(0);
              }}
              className="group cursor-pointer flex flex-col items-center"
            >
              {/* Core Orbital Ring Structure */}
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 duration-150">
                {/* Outer rotating energy ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_12s_linear_infinite]" />

                {/* Inner counter-rotating ring */}
                <div className="absolute inset-3 rounded-full border border-amber-400/30 animate-[spin_8s_linear_infinite_reverse]" />

                {/* Shield HP Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="44%"
                    stroke="#1e293b"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="44%"
                    stroke={roundTarget.hp < 30 ? '#ef4444' : '#f59e0b'}
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 90}
                    strokeDashoffset={
                      2 * Math.PI * 90 * (1 - roundTarget.hp / roundTarget.maxHp)
                    }
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-200"
                  />
                </svg>

                {/* Core Reactor Disc */}
                <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full bg-slate-950 border-2 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center p-3 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80 mb-0.5">
                    Target Bounty
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-extrabold font-tabular text-amber-400">
                      {roundTarget.bountyAmount}
                    </span>
                    <span className="text-xs font-bold text-amber-500">DOGE</span>
                  </div>

                  {/* Shield HP Indicator */}
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-mono">
                    <span
                      className={
                        roundTarget.hp < 30
                          ? 'text-rose-400 font-bold'
                          : 'text-emerald-400'
                      }
                    >
                      HP {roundTarget.hp}%
                    </span>
                  </div>

                  {/* Breach prompt */}
                  <span className="mt-1 text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors">
                    Click / Shoot!
                  </span>
                </div>
              </div>

              {/* Target Address Display Banner */}
              <div className="mt-3 bg-slate-900/90 border border-amber-500/30 rounded-lg px-3 py-1.5 max-w-xs shadow-lg">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Target Doge Address:</span>
                  <span className="text-amber-400 font-mono text-[10px]">
                    {roundTarget.addressSource}
                  </span>
                </div>
                <p className="font-mono text-xs text-amber-300 truncate" title={roundTarget.targetAddress}>
                  {roundTarget.targetAddress}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-slate-400">Target Core Idle</p>
              <button
                onClick={fetchNewTarget}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg text-xs hover:bg-amber-400"
              >
                Spawn New Target
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Winner Payout Celebration Modal */}
      {winner && roundStatus === 'won' && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    BREACH CONFIRMED!
                  </span>
                  <span className="text-xs text-slate-400">
                    Round #{roundTarget?.roundNumber} Winner
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  {winner.player.name} WON {winner.amount} DOGE!
                </h3>
                <p className="text-xs font-mono text-amber-400 break-all mt-1">
                  Payout to: {winner.player.dogeAddress}
                </p>
                {winner.txid && (
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    TXID: {winner.txid.slice(0, 24)}...
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={fetchNewTarget}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <span>Next Shootout Round</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Individual Player Station Card in the Cockpit
interface PlayerStationCardProps {
  seatIndex: number;
  player?: EmployeePlayer;
  allEmployees: EmployeePlayer[];
  colorStyle: { main: string; text: string; border: string; bg: string; glow: string };
  shortcutKey: string;
  isAutoFire: boolean;
  isCooling: boolean;
  disabled: boolean;
  onToggleAutoFire: () => void;
  onSelectEmployee: (id: string) => void;
  onShoot: () => void;
}

const PlayerStationCard: React.FC<PlayerStationCardProps> = ({
  seatIndex,
  player,
  allEmployees,
  colorStyle,
  shortcutKey,
  isAutoFire,
  isCooling,
  disabled,
  onToggleAutoFire,
  onSelectEmployee,
  onShoot,
}) => {
  if (!player) return null;

  return (
    <div
      className={`bg-slate-950/90 backdrop-blur-md border ${colorStyle.border}/40 rounded-xl p-3 shadow-lg transition-all`}
    >
      <div className="flex items-center justify-between gap-1 mb-2">
        <select
          value={player.id}
          onChange={(e) => onSelectEmployee(e.target.value)}
          className="bg-slate-900 text-xs font-semibold text-slate-200 rounded border border-slate-800 px-1.5 py-0.5 outline-none truncate max-w-[130px] md:max-w-[150px]"
        >
          {allEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        {/* Auto Bot Toggle */}
        <button
          onClick={onToggleAutoFire}
          className={`p-1 rounded text-[10px] font-medium flex items-center gap-0.5 transition-colors ${
            isAutoFire
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
          title={isAutoFire ? 'Auto-Fire Bot Active' : 'Click to enable Auto-Fire Bot'}
        >
          <Bot className="w-3 h-3" />
          <span className="text-[9px]">{isAutoFire ? 'BOT ON' : 'MANUAL'}</span>
        </button>
      </div>

      <div className="flex items-baseline justify-between text-xs mb-2">
        <span className="text-slate-400 text-[11px]">Balance:</span>
        <span className="font-mono font-bold text-amber-400">
          {player.balance.toFixed(2)} DOGE
        </span>
      </div>

      {/* FIRE Button */}
      <button
        onClick={onShoot}
        disabled={disabled || isCooling}
        style={{ borderColor: colorStyle.main }}
        className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
          colorStyle.bg
        } ${colorStyle.text} border hover:bg-opacity-25 disabled:opacity-40 disabled:pointer-events-none`}
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>SHOOT [{shortcutKey}]</span>
      </button>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Won: {player.roundsWon} rds</span>
        <span className="truncate max-w-[90px]">{player.dogeAddress.slice(0, 6)}...</span>
      </div>
    </div>
  );
};
