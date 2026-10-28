import React, { useState, useEffect } from 'react';
import { 
  Heart, PlayCircle, ShieldCheck, ArrowRight, Share2, 
  CheckCircle2, Compass, FileText, Sparkles, AlertCircle, 
  Users, Volume2, Shield, Award, ExternalLink, X, Film
} from 'lucide-react';
import { 
  exploreApi, CampaignData, OfficialCampaignVideo, 
  FamilyStory 
} from '../../services/api';

interface SomeoneWaitingCampaignViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenPledgeModal?: () => void;
  guestId?: string;
  onActivityComplete?: (response: any) => void;
}

export const SomeoneWaitingCampaignView: React.FC<SomeoneWaitingCampaignViewProps> = ({
  onNavigateTab,
  onOpenPledgeModal,
  guestId,
  onActivityComplete
}) => {
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [activeVideo, setActiveVideo] = useState<OfficialCampaignVideo | null>(null);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [pledgeModalOpen, setPledgeModalOpen] = useState(false);
  const [pledgeName, setPledgeName] = useState('');
  const [pledgeSuccess, setPledgeSuccess] = useState<any | null>(null);
  const [submittingPledge, setSubmittingPledge] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, []);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const data = await exploreApi.getCampaign();
      setCampaignData(data);
      if (data.stories && data.stories.length > 0) {
        setSelectedStory(data.stories[0]);
      }
    } catch (err) {
      console.error('Failed to load campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuote = (quote: string) => {
    navigator.clipboard.writeText(quote);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const handleRegisterPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeName.trim()) return;
    setSubmittingPledge(true);
    try {
      const res = await exploreApi.signPledge({
        pledge_name: pledgeName.trim(),
        family_members_count: 4,
        commitments: [
          '100% Certified Helmet Chin-Strap Fastened',
          'Zero Mobile Phone Use While Operating Vehicle',
          'Rear Seatbelt Fastening for Every Occupant',
          'Never Ride with an Impaired Driver'
        ]
      });
      setPledgeSuccess(res);
      if (onActivityComplete) {
        onActivityComplete(res);
      }
    } catch (err) {
      console.error('Pledge registration failed:', err);
    } finally {
      setSubmittingPledge(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950 border border-amber-500/30 rounded-3xl p-6 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold tracking-wide shadow-sm">
            <Heart className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
            <span>NATIONAL ROAD SAFETY CITIZEN MOVEMENT</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black tracking-tight text-white leading-tight">
            “Someone Is Waiting for You.”
          </h1>

          <p className="text-amber-100/90 text-sm md:text-lg leading-relaxed font-light">
            Every statistic on our roads has a name, a family, and an empty chair at the dinner table. 
            Before you accelerate on amber, check your phone, or skip your helmet—remember the people whose happiness depends on your safe return.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-amber-300/90 font-serif italic">
            <span>“Make Safety a Habit. Make Coming Home a Promise.”</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline">“Every Family Deserves Another Dinner Together.”</span>
          </div>

          {/* 4 Working Functional Actions */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={() => onNavigateTab('case_studies')}
              className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 hover:bg-slate-800 text-left transition-all group flex items-start gap-3.5 shadow-lg shadow-cyan-500/5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span>Explore Real Accident Cases</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  10 verified crash investigations with documented sequences and quizzes.
                </p>
              </div>
            </button>

            <a
              href="#video-gallery-section"
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 hover:bg-slate-800 text-left transition-all group flex items-start gap-3.5 shadow-lg shadow-amber-500/5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span>Watch Road Safety Stories</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Official MoRTH & WHO awareness films on helmets, seatbelts, and speed.
                </p>
              </div>
            </a>

            <button
              onClick={() => onNavigateTab('game_decision')}
              className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-800 text-left transition-all group flex items-start gap-3.5 shadow-lg shadow-emerald-500/5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span>Take a Safety Challenge</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Practice defensive maneuvers in the interactive Decision Simulator (+15 XP).
                </p>
              </div>
            </button>

            <button
              onClick={() => (onOpenPledgeModal ? onOpenPledgeModal() : setPledgeModalOpen(true))}
              className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 to-slate-900 border border-rose-500/40 hover:border-rose-400 hover:bg-slate-800 text-left transition-all group flex items-start gap-3.5 shadow-lg shadow-rose-500/5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span>Make a Road Safety Pledge</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Register your certified household commitment and earn your certificate (+120 XP).
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SIX EMOTIONAL STORY SECTIONS */}
      <section className="space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Real Family Narratives & The Power of Prevention</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">
              Choices That Travel Home With You
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Respectful, true-to-life experiences exploring how a split-second defensive habit preserved a lifetime of family moments.
          </p>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-400 text-sm">
            Loading campaign stories...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Story Navigation Selector (Left Column) */}
            <div className="lg:col-span-5 space-y-3">
              {(campaignData?.stories || []).map((story, idx) => {
                const isSelected = selectedStory?.id === story.id;
                return (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className={`p-4 rounded-2xl border cursor-pointer transition text-left space-y-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-400">
                        Story {idx + 1} • {story.character.split('(')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {story.safety_principle?.split('&')[0]}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm leading-snug">
                      {story.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {story.tagline}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Active Story Reader (Right Column) */}
            {selectedStory && (
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="space-y-2 border-b border-slate-800 pb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-400 font-medium">
                      {selectedStory.character}
                    </span>
                    <button
                      onClick={() => handleCopyQuote(selectedStory.quote)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedQuote ? 'Quote Copied!' : 'Share Quote'}</span>
                    </button>
                  </div>

                  <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                    {selectedStory.title}
                  </h2>
                  <p className="text-xs text-amber-300/90 italic font-medium">
                    {selectedStory.tagline}
                  </p>
                </div>

                {/* Emotional Quote Box */}
                <blockquote className="bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-200/95 font-serif italic text-sm md:text-base leading-relaxed">
                  {selectedStory.quote}
                </blockquote>

                {/* Narrative Text */}
                <div className="text-xs md:text-sm text-slate-300 leading-relaxed space-y-3 font-normal whitespace-pre-line">
                  {selectedStory.story || selectedStory.narrative}
                </div>

                {/* Safety Principle & Practical Action Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>The Defensive Habit That Protects You:</span>
                  </div>

                  <p className="text-xs text-slate-200 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl font-medium">
                    👉 <strong>Action to Take Today:</strong> {selectedStory.practical_action || selectedStory.safety_habit}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Key Life Takeaways:</span>
                    {(selectedStory.takeaways || []).map((t: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>

                  {selectedStory.related_activity_tab && (
                    <div className="pt-2">
                      <button
                        onClick={() => onNavigateTab(selectedStory.related_activity_tab)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-300 hover:text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <span>{selectedStory.related_activity_title || 'Take Related Safety Assessment'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. OFFICIAL ROAD SAFETY VIDEO GALLERY (PHASE 4) */}
      <section id="video-gallery-section" className="space-y-6 pt-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Film className="w-4 h-4" />
              <span>Official Government & WHO Public Safety Films</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">
              Watch Road Safety in Motion
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Verified educational films from the Ministry of Road Transport and Highways (MoRTH), WHO, and National Safety Board.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(campaignData?.videos || []).map(video => (
            <div
              key={video.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                {/* Video Player / Thumbnail Preview */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center group overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950/40 flex items-center justify-center p-6 text-center">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {video.duration} • {video.topic.split('&')[0]}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveVideo(video)}
                    className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <PlayCircle className="w-4 h-4" /> Watch Film
                    </span>
                  </button>
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                    {video.publisher}
                  </span>
                  <h3 className="font-bold text-white text-sm leading-snug">
                    {video.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {video.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs">
                <button
                  onClick={() => setActiveVideo(video)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> Watch Here
                </button>

                <a
                  href={video.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                  title="Open official publisher source"
                >
                  <span>Official Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MODAL: RESPONSIVE OFFICIAL VIDEO PLAYER */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase">{activeVideo.publisher}</span>
                <h3 className="text-sm md:text-base font-bold text-white">{activeVideo.title}</h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black relative">
              <iframe
                src={activeVideo.embed_url}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-5 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="space-y-1 text-slate-300 text-left">
                <p className="font-semibold text-white">💡 Key Safety Takeaway:</p>
                <p className="text-slate-400">{activeVideo.key_takeaway}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={activeVideo.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition"
                >
                  <span>Publisher Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: INTERACTIVE FAMILY ROAD-SAFETY PLEDGE */}
      {pledgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => { setPledgeModalOpen(false); setPledgeSuccess(null); }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {!pledgeSuccess ? (
              <form onSubmit={handleRegisterPledge} className="space-y-5">
                <div className="space-y-2 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" />
                    <span>CERTIFIED ROAD SAFETY PLEDGE (+120 XP)</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">
                    Make Safety a Promise to Your Family
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sign the official household road-safety commitment and unlock the verified <strong>Family Safety Advocate</strong> achievement badge.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300">
                  <p className="font-semibold text-white">Our 4 Unbreakable Family Commitments:</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>100% Certified Helmet with chin-strap fastened on every two-wheeler trip.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rear 3-point seatbelts buckled for every passenger before vehicle rolls.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero phone interaction (handheld or hands-free) behind the wheel.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Never ride with or allow an impaired driver to touch the keys.</span>
                  </div>
                </div>

                <div className="text-left space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Family or Household Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={pledgeName}
                    onChange={(e) => setPledgeName(e.target.value)}
                    placeholder="e.g. The Reddy Family / Sharma Household"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-white text-xs placeholder:text-slate-600 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPledge || !pledgeName.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>{submittingPledge ? 'Registering Official Pledge...' : 'Sign Family Safety Pledge (+120 XP)'}</span>
                </button>
              </form>
            ) : (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <Award className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">OFFICIAL PLEDGE REGISTERED</span>
                  <h3 className="text-2xl font-serif font-bold text-white">{pledgeSuccess.pledge_name}</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Your household pledge is recorded in the TERA Safety Registry under ID <strong>{pledgeSuccess.pledge_id}</strong>.
                  </p>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-300 flex items-center justify-center gap-2 font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>+{pledgeSuccess.xp_awarded || 120} XP Awarded • Family Safety Advocate Badge Unlocked!</span>
                </div>

                <button
                  onClick={() => { setPledgeModalOpen(false); setPledgeSuccess(null); }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Return to Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
