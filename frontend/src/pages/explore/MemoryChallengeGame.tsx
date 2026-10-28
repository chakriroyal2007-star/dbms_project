import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, CheckCircle2, Award, Clock, Sparkles, 
  HelpCircle, Eye, Shield, Compass
} from 'lucide-react';

interface MemoryCard {
  id: number;
  pairId: number;
  type: 'SYMBOL' | 'MEANING';
  title: string;
  badge: string;
  description: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEMORY_PAIRS = [
  {
    pairId: 1,
    symbol: "🛑 STOP SIGN",
    badge: "REGULATORY",
    meaning: "Full Wheel Stop",
    desc: "Come to a complete stop before the stop line and look both ways before proceeding."
  },
  {
    pairId: 2,
    symbol: "⚠️ PEDESTRIAN ZEBRA",
    badge: "WARNING",
    meaning: "Pedestrian Priority",
    desc: "Motorists must yield complete right-of-way to anyone crossing on zebra markings."
  },
  {
    pairId: 3,
    symbol: "⛑️ ISI FULL-FACE HELMET",
    badge: "PROTECTION",
    meaning: "Cranial Deceleration",
    desc: "Crushes millisecond-by-millisecond to absorb kinetic impact and prevent fatal skull fractures."
  },
  {
    pairId: 4,
    symbol: "🎗️ 3-POINT SEATBELT",
    badge: "RESTRAINT",
    meaning: "Ejection Prevention",
    desc: "Spreads deceleration force across pelvic girdle and ribcage; prevents passengers becoming projectiles."
  },
  {
    pairId: 5,
    symbol: "⏱️ 3-SECOND RULE",
    badge: "DEFENSIVE",
    meaning: "Perception Buffer",
    desc: "Maintains a safe space cushion to react and brake smoothly without rear-ending traffic."
  },
  {
    pairId: 6,
    symbol: "🌧️ LOW-BEAM IN MONSOON",
    badge: "VISIBILITY",
    meaning: "Glare Elimination",
    desc: "Low-beams aim downward at the asphalt rather than reflecting off rain droplets back into your eyes."
  }
];

export interface MemoryGameProps {
  onComplete?: (moves: number, time: number, xp: number) => void;
  onCompleteActivity?: (xp: number, activityId: string, passed: boolean) => void;
  onExit?: () => void;
}

export const MemoryChallengeGame: React.FC<MemoryGameProps> = ({
  onComplete,
  onCompleteActivity,
  onExit
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize and shuffle deck
  const initializeGame = () => {
    const deck: MemoryCard[] = [];
    let idCounter = 1;

    MEMORY_PAIRS.forEach((p) => {
      deck.push({
        id: idCounter++,
        pairId: p.pairId,
        type: 'SYMBOL',
        title: p.symbol,
        badge: p.badge,
        description: p.desc,
        isFlipped: false,
        isMatched: false
      });
      deck.push({
        id: idCounter++,
        pairId: p.pairId,
        type: 'MEANING',
        title: p.meaning,
        badge: p.badge,
        description: p.desc,
        isFlipped: false,
        isMatched: false
      });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setTimerSeconds(0);
    setIsTimerActive(true);
    setIsCompleted(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && !isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isCompleted]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
        // Matched!
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setMatches(m => {
            const newMatches = m + 1;
            if (newMatches === MEMORY_PAIRS.length) {
              setIsCompleted(true);
              setIsTimerActive(false);
              if (onCompleteActivity) {
                onCompleteActivity(80, "GAME_MEMORY_CHALLENGE", true);
              }
              if (onComplete) {
                onComplete(moves + 1, timerSeconds, 80);
              }
            }
            return newMatches;
          });
        }, 500);
      } else {
        // Not matched, flip back after brief pause
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 1100);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans select-none">
      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800/40 font-bold text-[10px] uppercase">
            ROAD SAFETY MEMORY MATRIX
          </span>
          <span className="text-zinc-400">
            Matches: <strong className="text-cyan-400">{matches}</strong> / {MEMORY_PAIRS.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">Moves: <strong className="text-white">{moves}</strong></span>
          <button
            onClick={initializeGame}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title="Reset Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Memory Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, idx) => {
          const showContent = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={showContent}
              className={`aspect-[4/3] rounded-2xl p-3 border transition-all flex flex-col justify-between text-left cursor-pointer relative overflow-hidden ${
                card.isMatched
                  ? 'bg-emerald-950/40 border-emerald-600/60 shadow-lg shadow-emerald-950/30 text-emerald-200'
                  : card.isFlipped
                  ? 'bg-cyan-950/60 border-cyan-500/80 shadow-lg shadow-cyan-950/40 text-cyan-100'
                  : 'bg-[#0E1526] hover:bg-[#141F38] border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {showContent ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase bg-black/40 px-1.5 py-0.5 rounded">
                      {card.badge}
                    </span>
                    {card.isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>

                  <div className="space-y-1 my-auto">
                    <h5 className="font-bold text-xs sm:text-sm text-white leading-tight">
                      {card.title}
                    </h5>
                    {card.isMatched && (
                      <p className="text-[10px] text-zinc-400 font-sans line-clamp-2">
                        {card.description}
                      </p>
                    )}
                  </div>

                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                    {card.type === 'SYMBOL' ? 'Sign / Protection' : 'Defensive Rule'}
                  </span>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-2 opacity-60">
                  <Shield className="w-6 h-6 text-zinc-600" />
                  <span className="text-[10px] font-mono text-zinc-600 uppercase font-bold tracking-wider">
                    TERA SAFE
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Completion Modal / Celebration */}
      {isCompleted && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0C1B29] to-[#0A1220] border border-cyan-800/60 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <Award className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
          <div className="space-y-1">
            <h4 className="text-xl font-bold text-white font-mono">
              ROAD SAFETY MEMORY COMPLETE!
            </h4>
            <p className="text-xs text-zinc-300 font-sans max-w-md mx-auto">
              You matched all {MEMORY_PAIRS.length} critical safety signs and protective measures in {moves} moves ({timerSeconds}s).
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 font-mono text-xs font-bold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>+80 Safety XP Earned</span>
          </div>

          <div>
            <button
              onClick={initializeGame}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
