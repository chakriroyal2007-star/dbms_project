import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Shield,
  Award,
  ExternalLink,
  ArrowLeft,
  BookOpen,
  Eye,
  ChevronRight,
  Info
} from 'lucide-react';
import { exploreApi, AccidentCaseStudy, ActivityCompletionResponse } from '../../services/api';

interface AccidentCaseStudiesViewProps {
  guestId?: string;
  onActivityComplete?: (response: ActivityCompletionResponse) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AccidentCaseStudiesView: React.FC<AccidentCaseStudiesViewProps> = ({
  guestId = 'guest_explore_user',
  onActivityComplete,
  onNavigateTab
}) => {
  const [caseStudies, setCaseStudies] = useState<AccidentCaseStudy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<AccidentCaseStudy | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Quiz state for selected case
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    score: number;
    total: number;
    passed: boolean;
    xpEarned?: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    loadCaseStudies();
  }, []);

  const loadCaseStudies = async () => {
    try {
      setLoading(true);
      const data = await exploreApi.getCaseStudies();
      setCaseStudies(data.case_studies || []);
    } catch (err) {
      console.error('Failed to load case studies:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Case Studies' },
    { id: 'HIGHWAY_PILEUP', label: 'Highway Pile-ups' },
    { id: 'HEAVY_VEHICLE', label: 'Heavy Commercial Vehicles' },
    { id: 'INTERSECTION_RIGHT_OF_WAY', label: 'Intersections' },
    { id: 'TWO_WHEELER_HELMET', label: 'Two-Wheeler Safety' },
    { id: 'COMMERCIAL_FATIGUE', label: 'Driver Fatigue' },
    { id: 'PEDESTRIAN_URBAN', label: 'Pedestrian Corridors' },
    { id: 'SEATBELT_ROLLOVER', label: 'Occupant Protection' },
    { id: 'MONSOON_AQUAPLANING', label: 'Wet Road / Aquaplaning' },
    { id: 'DISTRACTED_DRIVING', label: 'Distracted Driving' },
    { id: 'BLIND_CURVE_GHAT', label: 'Ghat / Hill Curves' }
  ];

  const filteredCases = caseStudies.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' || item.accident_type === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contributing_factors.some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const handleOpenCase = (item: AccidentCaseStudy) => {
    setSelectedCase(item);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLibrary = () => {
    setSelectedCase(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizFeedback(null);
  };

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedCase) return;
    const questions = selectedCase.quiz || [];
    if (Object.keys(quizAnswers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) {
        correctCount++;
      }
    });

    const passed = correctCount >= Math.ceil(questions.length * 0.75);
    const scorePct = Math.round((correctCount / questions.length) * 100);

    setSubmittingQuiz(true);
    try {
      const res = await exploreApi.completeActivity({
        session_id: guestId,
        activity_type: 'case_study',
        activity_id: selectedCase.id,
        score: scorePct,
        passed: passed,
        metadata: {
          case_id: selectedCase.id,
          case_title: selectedCase.title,
          correct_count: correctCount,
          total_questions: questions.length
        }
      });

      setQuizFeedback({
        score: correctCount,
        total: questions.length,
        passed: passed,
        xpEarned: res.xp_awarded,
        message: res.message
      });
      setQuizSubmitted(true);

      if (onActivityComplete) {
        onActivityComplete(res);
      }
    } catch (err) {
      console.error('Failed to submit case study quiz:', err);
      // Fallback feedback on offline/network error
      setQuizFeedback({
        score: correctCount,
        total: questions.length,
        passed: passed,
        xpEarned: passed ? 20 : 0,
        message: passed ? 'Assessment verified.' : 'Review explanations below.'
      });
      setQuizSubmitted(true);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* If a case study is selected, render the dedicated reader view */}
      {selectedCase ? (
        <div className="space-y-8">
          {/* Top navigation / Back bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={handleBackToLibrary}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-medium transition text-sm"
              id="btn-back-to-case-library"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Case Studies Library
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Case ID:</span>
              <span className="font-mono text-teal-400 font-semibold">{selectedCase.id}</span>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
                {selectedCase.accident_type_label}
              </span>
            </div>
          </div>

          {/* Sensitivity Disclaimer Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed space-y-1">
              <p className="font-semibold text-amber-300 tracking-wide uppercase">
                {selectedCase.sensitivity_label}
              </p>
              <p>
                This forensic analysis is synthesized from official Ministry of Road Transport and
                Highways (MoRTH) reports, CRRI crash research, and court-filed accident investigation
                documents. Graphic injury images and identifiable victim details are withheld to
                maintain dignity and educational focus.
              </p>
            </div>
          </div>

          {/* Header Banner */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-teal-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 max-w-4xl relative z-10">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                  {selectedCase.accident_type_label}
                </span>
                <span className="text-slate-400">📍 {selectedCase.location}</span>
                <span className="text-slate-400">📅 {selectedCase.date}</span>
                <span className="text-slate-400">👥 {selectedCase.road_user_category}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {selectedCase.title}
              </h1>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                {selectedCase.summary}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedCase.contributing_factors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                  >
                    #{factor}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section A: What Happened? */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                A
              </div>
              <h2 className="text-xl font-bold text-white">What Happened? (Reported Incident Sequence)</h2>
            </div>
            <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line">
              {selectedCase.what_happened}
            </p>
          </div>

          {/* Section B: What Do We Know? */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                B
              </div>
              <h2 className="text-xl font-bold text-white">What Do We Know? (Fact Verification Framework)</h2>
            </div>
            <p className="text-xs text-slate-400">
              TERA separates documented physical measurements from preliminary reports and unknown factors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Confirmed Facts */}
              <div className="p-5 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-3">
                <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  Confirmed Physical Facts
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedCase.what_do_we_know.confirmed_facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preliminary Reports */}
              <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Preliminary / Incomplete Data
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedCase.what_do_we_know.preliminary_or_unconfirmed.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unknown Details */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Explicitly Unknown Details
                </div>
                <ul className="space-y-2 text-xs text-slate-400">
                  {selectedCase.what_do_we_know.unknown_details.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section C: How Did the Crash Occur? */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                C
              </div>
              <h2 className="text-xl font-bold text-white">How Did the Crash Occur? (Systemic Breakdown)</h2>
            </div>

            <div className="space-y-4">
              {/* Immediate sequence */}
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Documented Immediate Impact Sequence
                </h3>
                <p className="text-sm font-mono text-slate-200">
                  {selectedCase.how_crash_occurred.immediate_sequence}
                </p>
              </div>

              {/* Contributing factors breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reported Technical Contributing Factors
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedCase.how_crash_occurred.contributing_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-red-400 font-bold">✕</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400 font-semibold uppercase">
                    Road & Environmental Factors
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedCase.how_crash_occurred.road_and_environment}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400 font-semibold uppercase">
                    Vehicle & Occupant Protection Factors
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedCase.how_crash_occurred.vehicle_and_occupant_factors}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Prevention Measures */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/30 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                D
              </div>
              <h2 className="text-xl font-bold text-white">
                What Could Have Reduced the Risk or Severity? (Countermeasures)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCase.prevention_measures.map((measure, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3"
                >
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                    {measure}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Road User Takeaways */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                E
              </div>
              <h2 className="text-xl font-bold text-white">What Can Each Road User Learn? (Takeaways)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                  🏍️ For Two-Wheeler Riders
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCase.road_user_takeaways.two_wheeler_riders}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
                  🚗 For Car Drivers & Passengers
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCase.road_user_takeaways.car_drivers_and_passengers}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  🚚 For Commercial & Heavy Vehicle Operators
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCase.road_user_takeaways.heavy_vehicle_drivers}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  🛣️ For Highway Authorities & Planners
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCase.road_user_takeaways.road_authorities}
                </p>
              </div>

              {selectedCase.road_user_takeaways.pedestrians_and_cyclists && (
                <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    🚶 For Pedestrians & Cyclists
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedCase.road_user_takeaways.pedestrians_and_cyclists}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section F: Test Your Understanding (Interactive Case Quiz) */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  F
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Test Your Understanding (Evidence-Based Assessment)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Demonstrate comprehension of the documented safety facts to earn +20 XP.
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Completion Reward: +20 XP</span>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-6">
              {selectedCase.quiz.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-white leading-relaxed">
                      {q.question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[qIdx] === optIdx;
                      const isCorrect = q.correct_index === optIdx;
                      let optionClasses =
                        'p-3.5 rounded-lg border text-xs font-medium text-left transition flex items-start gap-3 cursor-pointer ';

                      if (quizSubmitted) {
                        if (isCorrect) {
                          optionClasses +=
                            'bg-emerald-500/20 border-emerald-500/50 text-emerald-200';
                        } else if (isSelected && !isCorrect) {
                          optionClasses += 'bg-red-500/20 border-red-500/50 text-red-200';
                        } else {
                          optionClasses += 'bg-slate-800/30 border-slate-800 text-slate-500';
                        }
                      } else {
                        if (isSelected) {
                          optionClasses +=
                            'bg-teal-500/20 border-teal-500 text-white font-semibold shadow-sm';
                        } else {
                          optionClasses +=
                            'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => handleSelectAnswer(qIdx, optIdx)}
                          className={optionClasses}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-teal-400 bg-teal-500 text-slate-950 font-bold text-[9px]'
                                : 'border-slate-500'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </div>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation when submitted */}
                  {quizSubmitted && (
                    <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 space-y-1">
                      <div className="font-semibold text-teal-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Forensic Explanation:
                      </div>
                      <p className="leading-relaxed text-slate-300">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quiz Submit Action / Feedback */}
            {!quizSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={submittingQuiz}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2"
                id="btn-submit-case-quiz"
              >
                {submittingQuiz ? (
                  <span>Authorizing Submission with Server...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Assessment & Earn +20 XP
                  </>
                )}
              </button>
            ) : (
              <div className="p-5 rounded-xl bg-slate-900 border border-teal-500/30 text-center space-y-3">
                <div className="inline-flex items-center gap-2 text-teal-400 font-bold text-base">
                  <CheckCircle className="w-5 h-5" />
                  Assessment Completed! ({quizFeedback?.score}/{quizFeedback?.total} Correct)
                </div>
                <p className="text-xs text-slate-300">
                  {quizFeedback?.message || 'Server-verified completion recorded to ledger.'}
                </p>
                {quizFeedback?.xpEarned ? (
                  <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm">
                    +{quizFeedback.xpEarned} XP Earned
                  </div>
                ) : null}
                <div className="pt-2">
                  <button
                    onClick={handleBackToLibrary}
                    className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    Return to Case Studies Library
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section G: Sources and Further Reading */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                G
              </div>
              <h2 className="text-xl font-bold text-white">Sources and Official References</h2>
            </div>
            <p className="text-xs text-slate-400">
              Verified publications and technical accident investigation reports supporting this study:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {selectedCase.sources.map((source, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white leading-snug">{source.title}</h3>
                    <div className="text-[11px] text-teal-400">{source.publisher}</div>
                    <div className="text-[10px] text-slate-400">Published: {source.publication_date}</div>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200 font-medium hover:underline self-start"
                  >
                    Open Original Source
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Main Case Study Library View */
        <div className="space-y-8">
          {/* Hero Banner */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                Accredited Crash Investigation Archive
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                Major Accident Case Studies Library
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Objective, evidence-based analyses of real Indian roadway collisions. Each study
                follows the rigorous 7-section investigative framework (A–G) to identify root
                causes, separate verified facts from speculation, and outline proven prevention
                protocols.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                  <CheckCircle className="w-4 h-4" /> 10 Documented Investigations
                </span>
                <span>•</span>
                <span>All 7 Forensic Sections Complete</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">+20 XP Per Verified Assessment</span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search case studies by title, highway, contributing factor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition"
                  id="input-search-case-studies"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0 pl-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Category:
              </span>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      isActive
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Case Studies Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm">Loading accredited case study database...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Case Studies Match Your Filter</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try searching for different keywords or select "All Case Studies" to view the complete library.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-semibold hover:bg-teal-500/20 transition"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((caseStudy) => (
                <div
                  key={caseStudy.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition duration-300 flex flex-col justify-between overflow-hidden group shadow-lg"
                >
                  <div className="p-6 space-y-4">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
                        {caseStudy.accident_type_label}
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono font-medium flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> +20 XP
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition leading-snug line-clamp-2">
                      {caseStudy.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {caseStudy.summary}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="truncate">{caseStudy.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>📅</span>
                        <span>{caseStudy.date}</span>
                      </div>
                    </div>

                    {/* Contributing Factors chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {caseStudy.contributing_factors.slice(0, 2).map((factor, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono"
                        >
                          {factor}
                        </span>
                      ))}
                      {caseStudy.contributing_factors.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                          +{caseStudy.contributing_factors.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="p-4 bg-slate-900/80 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenCase(caseStudy)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-teal-500 text-slate-200 hover:text-slate-950 font-semibold text-xs transition duration-200 flex items-center justify-center gap-2 group-hover:bg-teal-500 group-hover:text-slate-950"
                      id={`btn-read-case-${caseStudy.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read Forensic Study & Take Quiz
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccidentCaseStudiesView;
