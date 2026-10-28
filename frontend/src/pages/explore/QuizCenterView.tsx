import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, CheckCircle2, XCircle, Award, BookOpen, 
  RotateCcw, Sparkles, Filter, ShieldAlert, ArrowRight,
  Clock, Check, Shuffle
} from 'lucide-react';
import { exploreApi, QuizQuestion } from '../../services/api';

interface QuizCenterViewProps {
  onCompleteQuiz?: (score: number, total: number, xp: number) => void;
  onExit?: () => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'helmet_motorcycle', name: 'Helmet & Motorcycle' },
  { id: 'seatbelt_passenger', name: 'Seatbelts & Restraints' },
  { id: 'road_signs', name: 'Signs & Markings' },
  { id: 'speed_management', name: 'Speed Management' },
  { id: 'distracted_driving', name: 'Distraction & Phones' },
  { id: 'pedestrian_cyclist', name: 'Pedestrians & Cyclists' },
  { id: 'night_driving', name: 'Night & Low Light' },
  { id: 'rain_slippery', name: 'Monsoon & Slippery' },
  { id: 'impaired_driving', name: 'Impaired Driving & DUI' },
  { id: 'fatigue', name: 'Driver Fatigue' },
  { id: 'emergency_awareness', name: 'Emergency & Ambulance' }
];

export const QuizCenterView: React.FC<QuizCenterViewProps> = ({ onCompleteQuiz, onExit }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [quizMode, setQuizMode] = useState<'daily' | 'topic' | 'challenge' | 'revision'>('daily');

  // Quiz Execution State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: { selected: number; isCorrect: boolean } }>({});
  const [missedQuestions, setMissedQuestions] = useState<QuizQuestion[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [activeCategory, quizMode]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await exploreApi.getQuizzes(activeCategory === 'all' ? undefined : { category: activeCategory });
      let list = [...data];
      if (quizMode === 'daily') {
        // Daily deterministic subset of 5 questions
        list = list.slice(0, 5);
      } else if (quizMode === 'challenge') {
        // Shuffle for challenge
        list = list.sort(() => Math.random() - 0.5);
      } else if (quizMode === 'revision') {
        if (missedQuestions.length > 0) {
          list = [...missedQuestions];
        }
      }
      setQuestions(list);
      resetQuizState();
    } catch {
      // Fallback questions if offline
      setQuestions([
        {
          id: 'q1',
          category: 'helmet_motorcycle',
          question: 'According to MoRTH Section 129 of the Motor Vehicles Act, which standard must a motorcycle helmet meet to be legally recognized in India?',
          options: [
            'Any industrial construction hard-hat',
            'ISI marked (IS 4151:2015) full-face or open-face with chinstrap properly buckled',
            'Any bicycle helmet with ventilation holes',
            'Non-certified novelty helmet provided it covers the head'
          ],
          correct_index: 1,
          explanation: 'Only helmets certified under Bureau of Indian Standards IS 4151:2015 are legally authorized. The chinstrap must be securely fastened; an unbuckled helmet ejects on impact.',
          citation: 'MoRTH Motor Vehicles (Amendment) Act 2019 & BIS IS 4151:2015',
          difficulty: 'easy'
        },
        {
          id: 'q2',
          category: 'seatbelt_passenger',
          question: 'What is the primary physical function of the pretensioner and load limiter in a modern 3-point seatbelt during a front collision?',
          options: [
            'To loosen the belt so the occupant can quickly exit',
            'To pull the occupant tightly back before impact and yield slightly to prevent rib fracture',
            'To activate the vehicle horn and flash hazards automatically',
            'To lock the steering wheel in place'
          ],
          correct_index: 1,
          explanation: 'Pyrotechnic pretensioners retract the webbing within milliseconds of impact detection, coupling the occupant to the deceleration of the chassis, while load limiters prevent excessive chest trauma.',
          citation: 'WHO Global Status Report on Road Safety & UNECE R16',
          difficulty: 'medium'
        }
      ]);
      resetQuizState();
    } finally {
      setLoading(false);
    }
  };

  const resetQuizState = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setQuizCompleted(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correct_index;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { selected: selectedOption, isCorrect }
    }));

    if (!isCorrect && !missedQuestions.some(q => q.id === currentQuestion.id)) {
      setMissedQuestions(prev => [...prev, currentQuestion]);
    }

    setIsAnswerSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz Finished
      setQuizCompleted(true);
      const score = Object.values(userAnswers).filter(a => a.isCorrect).length + (selectedOption === currentQuestion?.correct_index ? 1 : 0);
      const xpEarned = score * 15;
      if (onCompleteQuiz) {
        onCompleteQuiz(score, questions.length, xpEarned);
      }
    }
  };

  const currentQuestion = questions[currentIndex];
  const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Quiz Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-2">
              <BookOpen className="w-4 h-4" />
              <span>DEFENSIVE ROAD SAFETY ACADEMY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Interactive Quiz Center</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Master the physical laws, statutory rules, and defensive behaviors that keep every traveller safe.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> +15 XP / Correct Answer
            </span>
            {onExit && (
              <button 
                onClick={onExit}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white transition"
              >
                Back to Explore
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          {[
            { id: 'daily', label: 'Daily Safety Quiz', icon: Clock },
            { id: 'topic', label: 'Topic-Wise Mastery', icon: Filter },
            { id: 'challenge', label: 'Rapid Challenge Mode', icon: Shuffle },
            { id: 'revision', label: `Revision Bank (${missedQuestions.length})`, icon: RotateCcw }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = quizMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setQuizMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
                  isActive 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm' 
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter for Topic Mode */}
      {quizMode === 'topic' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading safety assessment questions...
        </div>
      )}

      {/* Active Quiz Card */}
      {!loading && !quizCompleted && currentQuestion && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Progress & Badge */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-4">
            <span className="font-semibold text-indigo-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 uppercase text-[10px] font-mono">
                {currentQuestion.difficulty}
              </span>
              <span className="text-slate-400">
                Score: <strong className="text-emerald-400">{correctCount}</strong> / {currentIndex}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-3">
            {currentQuestion.scenario && (
              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl text-xs text-amber-300/90 leading-relaxed font-mono">
                <strong>Scenario:</strong> {currentQuestion.scenario}
              </div>
            )}
            <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt: string, idx: number) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQuestion.correct_index;

              let optionStyle = 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80';
              if (isSelected && !isAnswerSubmitted) {
                optionStyle = 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200';
              } else if (isAnswerSubmitted) {
                if (isCorrectAnswer) {
                  optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
                } else {
                  optionStyle = 'opacity-40 border-slate-800 text-slate-500';
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-xs flex items-center justify-center font-bold text-slate-300">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs md:text-sm font-medium">{opt}</span>
                  </div>
                  {isAnswerSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Answer Explanation Box (Immediate Feedback) */}
          {isAnswerSubmitted && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold">
                {selectedOption === currentQuestion.correct_index ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Correct Answer! (+15 XP)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Crucial Safety Concept to Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentQuestion.explanation}
              </p>
              {currentQuestion.citation && (
                <p className="text-[11px] text-slate-500 font-mono pt-1">
                  Reference: {currentQuestion.citation}
                </p>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-800">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition disabled:opacity-40"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:brightness-110 transition"
              >
                {currentIndex + 1 < questions.length ? 'Next Question' : 'View Quiz Results'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Completion Summary */}
      {quizCompleted && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Assessment Complete</span>
            <h2 className="text-2xl font-bold text-white">Your Safety Score: {correctCount} / {questions.length}</h2>
            <p className="text-xs text-slate-400">
              {correctCount === questions.length 
                ? 'Outstanding! You have mastered these road safety principles.' 
                : 'Great effort! Take a moment to review the concepts you missed to reinforce safe habits.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800 text-left text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block">XP Earned</span>
              <strong className="text-lg text-amber-400 font-mono">+{correctCount * 15} XP</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block">Accuracy</span>
              <strong className="text-lg text-emerald-400 font-mono">
                {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                resetQuizState();
                loadQuestions();
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-500 transition"
            >
              <RotateCcw className="w-4 h-4" /> Retake Quiz
            </button>
            {missedQuestions.length > 0 && (
              <button
                onClick={() => {
                  setQuizMode('revision');
                }}
                className="px-5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-500/20 transition"
              >
                <BookOpen className="w-4 h-4" /> Practice {missedQuestions.length} Missed Concept(s)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
