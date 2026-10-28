import React, { useState, useEffect } from 'react';
import { 
  Heart, Sparkles, Clock, Share2, BookOpen, 
  ArrowRight, CheckCircle2, Volume2, ShieldCheck
} from 'lucide-react';
import { exploreApi, FamilyStory } from '../../services/api';

interface EmotionalStoriesViewProps {
  onSelectLesson?: (lessonId: string) => void;
  onExit?: () => void;
}

export const EmotionalStoriesView: React.FC<EmotionalStoriesViewProps> = ({ onSelectLesson, onExit }) => {
  const [stories, setStories] = useState<FamilyStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<FamilyStory | null>(null);
  const [copiedQuote, setCopiedQuote] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await exploreApi.getStories();
      setStories(data);
      if (data.length > 0) {
        setSelectedStory(data[0]);
      }
    } catch {
      // Offline fallback
      const fallback: FamilyStory[] = [
        {
          id: 'story_1',
          title: 'The Dinner Table That Remained Full',
          character: 'Kiran (Software Engineer & Father of 5-year-old Ananya)',
          tagline: 'A five-second pause at a yellow light protected a lifetime of bedtime stories.',
          quote: '“Whenever my thumb twitches towards my ringing phone on my motorcycle, I picture Ananya waiting at our doorway with her storybook.”',
          story: 'It was a rainy Tuesday dusk in Tirupati. Kiran was running late for dinner after a prolonged sprint review at work. As he approached the busy Ramanuja Circle intersection, the traffic signal transitioned from green to amber. A delivery rider behind him honked aggressively, urging him to accelerate through the junction before the red.\n\nKiran felt the urgent pull to rush. But then he remembered his five-year-old daughter Ananya, who had proudly made him promise that morning: "Papa, you promised to read chapter four of the jungle book together tonight." He applied progressive braking and came to a calm stop behind the white line.\n\nTwo seconds later, a loaded sand tipper truck coming from the cross street suffered brake fade and blew through the red signal at 60 km/h, obliterating an auto-rickshaw that had tried to jump the light.\n\nKiran reached home 12 minutes later than intended. But he reached home. At 8:30 PM, sitting beside Ananya as she drifted off to sleep, Kiran held her hand and realized: no urgent meeting, phone call, or impatience was worth the dinner table being empty.',
          safety_principle: 'Intersection Dilemma Zone & Defensive Deceleration',
          takeaways: [
            'Amber signals mean stop safely, not accelerate aggressively.',
            'Impatience saves seconds at the risk of decades.',
            'Families measure your journey not by your speed, but by your arrival.'
          ]
        },
        {
          id: 'story_2',
          title: 'The Click That Saved Everything',
          character: 'Dr. Radhika & Her 8-Year-Old Son Vivaan',
          tagline: 'Rear seatbelts are not optional. They are the invisible embrace that defies physics.',
          quote: '“People used to laugh when I insisted everyone in the back seat buckle up. Now my son is here because of that click.”',
          story: 'Dr. Radhika was driving Vivaan home from basketball practice along the Tirupati-Renigunta bypass. A stray stray cattle suddenly bolted onto the unlit roadway from behind a high median shrub. Radhika executed an emergency collision-avoidance swerve and hard brake.\n\nThe vehicle spun 180 degrees and struck the highway guardrail. Inside the vehicle, the forces were violent. But Vivaan was securely buckled in his rear 3-point seatbelt. The pyrotechnic pretensioner held him firmly into the cushioned contours of his seat. Aside from mild chest bruising from the belt webbing, both walked out completely unharmed.',
          safety_principle: 'Rear Passenger Kinetic Decoupling & Child Safety',
          takeaways: [
            'Rear occupants without seatbelts become lethal human projectiles in a crash.',
            'Every occupant must buckle up before the vehicle rolls forward.',
            'Physical laws apply equally whether traveling 500 meters or 500 kilometers.'
          ]
        },
        {
          id: 'story_3',
          title: 'The Pillion Promise',
          character: 'Arun & His College Best Friend Sameer',
          tagline: 'True friendship is handing your pillion rider a certified helmet.',
          quote: '“I told him: If you don’t wear the second helmet, we take the city bus. That one rule saved his life.”',
          story: 'Arun had bought a second ISI-certified helmet with his very first internship stipend. When Sameer wanted a quick ride to the university library, Arun refused to let him mount until Sameer fastened the chinstrap.\n\nTen minutes later, an errant autorickshaw opened its passenger door right into their lane. Sameer was thrown onto the curb, his head striking the concrete edge. The helmet shell cracked as designed, absorbing over 300 Gs of impact energy. Sameer survived with zero intracranial trauma.',
          safety_principle: 'Pillion Rider Vulnerability & Cranial Impact Dissipation',
          takeaways: [
            'Pillion passengers bear nearly 50% of two-wheeler fatalities in India.',
            'A helmet in hand or on the fuel tank protects nothing—strap it securely.',
            'Refusing to ride without protection is the ultimate act of friendship.'
          ]
        }
      ];
      setStories(fallback);
      setSelectedStory(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuote = (quote: string) => {
    navigator.clipboard.writeText(quote);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Campaign Hero Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-950 to-rose-950/70 border border-amber-500/30 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-amber-400" />
            <span>SPECIAL EMOTIONAL AWARENESS CAMPAIGN</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
            “Someone Is Waiting for You.”
          </h1>

          <p className="text-amber-100/90 text-sm md:text-base leading-relaxed font-light">
            Every statistic on our roads has a name, a family, and a chair left empty at the dinner table. 
            Before you accelerate, check your phone, or skip your helmet—remember the people whose happiness depends on your safe arrival.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs">
            <span className="text-amber-300/90 italic">“Slow Down. Look Around. Someone Loves You.”</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-300/90 italic">“Make Safety a Habit. Make Coming Home a Promise.”</span>
          </div>
        </div>
      </div>

      {/* Stories Grid & Detailed Viewer */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 text-sm">
          Loading campaign stories...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Story Selection Thumbnails (Left Column) */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Heartfelt Journeys & Safe Returns
            </h2>

            {stories.map(story => {
              const isSelected = selectedStory?.id === story.id;
              return (
                <div
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className={`p-5 rounded-2xl border cursor-pointer transition text-left space-y-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase">
                      {story.character.split('(')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {story.safety_principle}
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
              {/* Story Header */}
              <div className="space-y-2 border-b border-slate-800 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-400 font-medium">
                    {selectedStory.character}
                  </span>
                  <button
                    onClick={() => handleCopyQuote(selectedStory.quote)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedQuote ? 'Quote Copied!' : 'Share Quote'}
                  </button>
                </div>
                <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                  {selectedStory.title}
                </h2>
                <p className="text-xs text-amber-300/80 italic font-medium">
                  {selectedStory.tagline}
                </p>
              </div>

              {/* Quote Highlight Box */}
              <blockquote className="bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-200/95 font-serif italic text-sm md:text-base leading-relaxed">
                {selectedStory.quote}
              </blockquote>

              {/* Narrative Content */}
              <div className="text-xs md:text-sm text-slate-300 leading-relaxed space-y-3 font-normal whitespace-pre-line">
                {selectedStory.story}
              </div>

              {/* Safety Principles & Takeaways */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Key Road Safety Principles to Live By:</span>
                </div>
                <div className="space-y-2">
                  {selectedStory.takeaways.map((takeaway: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
