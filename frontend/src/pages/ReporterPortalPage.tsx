import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, MapPin, Send, CheckCircle2, ShieldAlert, 
  Flame, Navigation, Users, Clock, ArrowRight, RefreshCw, PhoneCall, Radio,
  Activity, CheckCircle, Search, FileText, UserCheck, Shield, LifeBuoy, Check,
  Mic, MicOff, Camera, Upload, Play, Square, HeartHandshake, BookOpen, AlertCircle,
  ExternalLink, Copy, HelpCircle
} from 'lucide-react';
import { incidentsApi, evidenceApi } from '../services/api';
import { Incident, User, PublicTrackedIncident } from '../types';
import { PublicTrackerModal } from '../components/PublicTrackerModal';

interface ReporterPortalPageProps {
  initialSubTab?: 'emergency' | 'first_aid' | 'my_incidents' | 'learn';
  onSwitchToEOC?: () => void;
  user?: User | null;
}

export const ReporterPortalPage: React.FC<ReporterPortalPageProps> = ({ 
  initialSubTab = 'emergency', 
  onSwitchToEOC,
  user 
}) => {
  const [activeTab, setActiveTab] = useState<'emergency' | 'first_aid' | 'my_incidents' | 'learn'>(initialSubTab);
  
  // Emergency Form State
  const [incidentType, setIncidentType] = useState('ROAD_ACCIDENT');
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Andhra Pradesh');
  const [district, setDistrict] = useState('Tirupati');
  const [city, setCity] = useState('Tirupati');
  const [locality, setLocality] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [patientCount, setPatientCount] = useState<number>(1);
  const [unknownCasualties, setUnknownCasualties] = useState<boolean>(false);
  const [severity, setSeverity] = useState('CRITICAL');
  const [reporterName, setReporterName] = useState(user?.full_name || '');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterConsent, setReporterConsent] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 13.6288, lng: 79.4192 });
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isLocationVerified, setIsLocationVerified] = useState<boolean>(false);
  
  // Voice AI & Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceAudioBlob, setVoiceAudioBlob] = useState<Blob | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Photo Evidence State
  const [uploadedEvidence, setUploadedEvidence] = useState<Array<{ url: string; category: string; filename: string }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission & Receipt State
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // My Reports & Live Persistence
  const [myReports, setMyReports] = useState<Incident[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Active Tracker Modal State
  const [activeTrackedIncident, setActiveTrackedIncident] = useState<PublicTrackedIncident | null>(null);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);

  // Quick Tracking Search in tab
  const [searchCode, setSearchCode] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Location Presets
  const locationPresets = [
    {
      label: "Alipiri Bypass Circle (Sector 2)",
      locality: "Alipiri Corridor",
      landmark: "Garuda Statue Circle",
      lat: 13.6550,
      lng: 79.3950,
      fullName: "Alipiri Bypass Circle Sector 2, Tirupati"
    },
    {
      label: "NH-71 Airport Expressway (Km 14)",
      locality: "Airport Corridor",
      landmark: "Tirupati Airport Toll Gate",
      lat: 13.6420,
      lng: 79.4850,
      fullName: "NH-71 Expressway Km 14 Near Airport Junction, Tirupati"
    },
    {
      label: "Town Center Plaza (Gandhi Road)",
      locality: "Central Commercial Sector",
      landmark: "Gandhi Road Clock Tower",
      lat: 13.6260,
      lng: 79.4210,
      fullName: "Town Center Plaza, Gandhi Road, Tirupati"
    },
    {
      label: "Settipalli Freight Hub (Block C)",
      locality: "Settipalli Industrial Hub",
      landmark: "Railway Cargo Gate 4",
      lat: 13.6180,
      lng: 79.4520,
      fullName: "Settipalli Freight Yard Shed 3, Tirupati"
    }
  ];

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true);
      const data = await incidentsApi.getAll({ my_reports: true, limit: 25 });
      setMyReports(data || []);
    } catch (err) {
      console.warn('Could not fetch user-specific reports; falling back to local history:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
    const interval = setInterval(fetchMyReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPreset = (preset: typeof locationPresets[0]) => {
    setLocality(preset.locality);
    setLandmark(preset.landmark);
    setLocationName(preset.fullName);
    setCoords({ lat: preset.lat, lng: preset.lng });
    setLocationAccuracy(null);
    setIsLocationVerified(false);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setCoords({ lat, lng });
          setLocationAccuracy(acc);
          setIsLocationVerified(true);
          setLocationName(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)}) - Tirupati Area`);
          setLocality("GPS Live Radius");
          setLandmark(`Accuracy: ±${acc}m`);
        },
        (err) => {
          console.warn("GPS access denied or unavailable, using preset:", err);
          handleSelectPreset(locationPresets[0]);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      handleSelectPreset(locationPresets[0]);
    }
  };

  // ---------------------------------------------------------------------------
  // Voice Recording Pipeline (MediaRecorder API)
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Voice Recording Pipeline (MediaRecorder + Web Speech API)
  // ---------------------------------------------------------------------------
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startVoiceRecording = async () => {
    try {
      setError(null);
      setSpeechNotice(null);
      setVoiceTranscript(''); // Clear previous recording so it never lingers
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setVoiceAudioBlob(audioBlob);
        stream.getTracks().forEach(t => t.stop());
        
        // Upload audio and obtain transcript
        await processVoiceAudio(audioBlob);
      };

      // Native Web Speech API real-time recognition if available in browser
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            if (current.trim()) {
              setVoiceTranscript(current.trim());
              // Automatically populate description with live real speech
              setDescription(prev => prev ? prev : current.trim());
            }
          };
          recognition.onerror = (e: any) => {
            console.warn("Browser SpeechRecognition warning:", e.error);
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (recErr) {
          console.warn("Could not start native Web Speech API:", recErr);
        }
      }

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access failed:", err);
      setError("Microphone access was denied or is not supported. Please type your emergency description.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop error
      }
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    audioChunksRef.current = [];
    setVoiceAudioBlob(null);
    setVoiceTranscript('');
    setSpeechNotice("Voice recording was cancelled.");
  };

  const processVoiceAudio = async (blob: Blob) => {
    if (blob.size < 500) {
      setSpeechNotice("Recording was too short or empty. Please record again or type details.");
      return;
    }

    try {
      setIsTranscribing(true);
      const audioFile = new File([blob], `voice_report_${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadRes = await evidenceApi.upload(audioFile, 'AUDIO');
      
      if (uploadRes && uploadRes.file_url) {
        setUploadedEvidence(prev => [...prev, {
          url: uploadRes.file_url,
          category: 'AUDIO',
          filename: uploadRes.filename || 'voice_recording.webm'
        }]);

        // If backend returned a transcript from Python SpeechRecognition, use it
        if (uploadRes.transcript && uploadRes.transcript.trim()) {
          setVoiceTranscript(uploadRes.transcript.trim());
          setDescription(prev => prev ? prev : uploadRes.transcript.trim());
          setSpeechNotice("Speech successfully recognized. Please review and edit below if needed.");
        } else if (uploadRes.transcription_message) {
          // If no speech heard, inform the user honestly without inventing words!
          if (!voiceTranscript) {
            setSpeechNotice(uploadRes.transcription_message);
          }
        }
      }
    } catch (err: any) {
      console.warn("Audio upload error:", err);
      if (!voiceTranscript) {
        setSpeechNotice("Speech recognition service was unreachable. Please type your emergency details directly.");
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Photo Evidence Upload
  // ---------------------------------------------------------------------------
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("File exceeds 15MB limit. Please upload a compressed photo.");
      return;
    }

    try {
      setUploadingFile(true);
      const res = await evidenceApi.upload(file, 'PHOTO');
      if (res && res.file_url) {
        setUploadedEvidence(prev => [...prev, {
          url: res.file_url,
          category: 'PHOTO',
          filename: res.filename || file.name
        }]);
      }
    } catch (err: any) {
      console.error("Photo upload failed:", err);
      setError(err?.response?.data?.detail || "Photo upload failed. Continuing with textual report.");
    } finally {
      setUploadingFile(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Submit Emergency Report
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !description.trim()) {
      setError("Please fill in location and emergency description.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        incident_type: incidentType,
        description,
        severity,
        latitude: coords.lat,
        longitude: coords.lng,
        country,
        state: stateName,
        district,
        city,
        locality,
        landmark,
        location_name: locationName,
        estimated_patient_count: unknownCasualties ? 0 : Number(patientCount),
        reporter_name: reporterName || user?.full_name || "Bystander Informant",
        reporter_contact: reporterPhone || "N/A",
        reporter_consent: reporterConsent,
        voice_transcript: voiceTranscript || undefined,
        detected_language: 'en',
        location_accuracy_meters: locationAccuracy || undefined,
        is_location_verified: isLocationVerified,
        evidence_urls: uploadedEvidence
      };

      const data = await incidentsApi.reportEmergency(payload);
      setReceipt(data);

      // Save to local storage for quick bystander tracking recovery
      try {
        const savedCodes = JSON.parse(localStorage.getItem('tera_tracked_incidents') || '[]');
        if (!savedCodes.some((i: any) => i.tracking_code === data.tracking_code)) {
          savedCodes.unshift({
            tracking_code: data.tracking_code,
            incident_id: data.incident_id,
            incident_type: data.incident_type,
            location_name: data.location_name,
            reported_at: data.reported_at
          });
          localStorage.setItem('tera_tracked_incidents', JSON.stringify(savedCodes.slice(0, 10)));
        }
      } catch (storageErr) {
        console.warn("Storage write error:", storageErr);
      }

      fetchMyReports();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit emergency report to database.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setDescription('');
    setVoiceTranscript('');
    setUploadedEvidence([]);
    setPatientCount(1);
    setUnknownCasualties(false);
  };

  const openTrackerForCode = async (code: string) => {
    try {
      setTrackingLoading(true);
      setTrackingError(null);
      const res = await incidentsApi.trackByCode(code);
      setActiveTrackedIncident(res);
      setIsTrackerModalOpen(true);
    } catch (err: any) {
      setTrackingError(`Tracking code '${code}' not found or invalid.`);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#070B14] via-[#0B1120] to-[#070B14] p-4 sm:p-8 max-w-6xl mx-auto space-y-6 font-mono text-gray-200">
      
      {/* Top Banner & Mobile-First Role Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/40">
              TERA ASSIST • PUBLIC CITIZEN PORTAL
            </span>
            <span className="text-[10px] text-gray-500 font-sans">STRICT VERIFICATION • ZERO FICTITIOUS DATA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            <span>Emergency Assistance & Reporting</span>
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Rapid bystander reporting, medically vetted first-aid guidance, and durable end-to-end incident tracking.
          </p>
        </div>

        {/* 4 Standardized Portal Sections */}
        <div className="flex items-center bg-[#111827] border border-[#1F293D] rounded-xl p-1 text-xs overflow-x-auto">
          <button
            onClick={() => { setActiveTab('emergency'); setReceipt(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'emergency' ? 'bg-cyan-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Emergency</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('first_aid'); setReceipt(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'first_aid' ? 'bg-cyan-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>First Aid</span>
          </button>

          <button
            onClick={() => { setActiveTab('my_incidents'); setReceipt(null); fetchMyReports(); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'my_incidents' ? 'bg-cyan-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Incidents</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-cyan-200 font-bold">
              {myReports.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('learn'); setReceipt(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'learn' ? 'bg-cyan-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learn</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: EMERGENCY REPORTING & SUBMISSION */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'emergency' && (
        <div className="space-y-6 animate-in fade-in">
          {receipt ? (
            /* Confirmation Receipt Screen with Durable Tracking Code */
            <div className="bg-[#0B1120] border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                <div className="p-3 bg-cyan-500/20 rounded-full border border-cyan-500/40 text-cyan-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    INCIDENT PERSISTED & BROADCAST TO EOC QUEUE
                  </span>
                  <h2 className="text-xl font-bold text-gray-100">
                    Emergency Report Successfully Recorded
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-sans">
                    Incident ID <span className="text-cyan-300 font-bold">{receipt.incident_id}</span> is logged in the coordination database. Control Operators are notified.
                  </p>
                </div>
              </div>

              {/* Prominent Durable Tracking Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/70 to-blue-950/60 border border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-cyan-300 uppercase font-bold tracking-wider">
                    DURABLE TRACKING REFERENCE
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider mt-0.5">
                    {receipt.tracking_code}
                  </div>
                  <div className="text-[11px] text-gray-400 font-sans mt-1">
                    Save this code or bookmark it to track real-time verification and ambulance dispatch status.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openTrackerForCode(receipt.tracking_code)}
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Live Status Tracker</span>
                </button>
              </div>

              {/* Receipt Key-Value Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Incident ID</span>
                  <span className="font-bold text-cyan-300 text-sm">{receipt.incident_id}</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Current Status</span>
                  <span className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    {receipt.status}
                  </span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Emergency Type</span>
                  <span className="font-bold text-gray-200">{receipt.incident_type.replace(/_/g, ' ')}</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Location / Locality</span>
                  <span className="font-bold text-gray-200 truncate block">{receipt.location_name}</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Affected People</span>
                  <span className="font-bold text-amber-300">
                    {receipt.estimated_patient_count === 0 ? 'Unconfirmed / Unknown' : `${receipt.estimated_patient_count} Patients`}
                  </span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Reported At</span>
                  <span className="font-bold text-gray-400">
                    {new Date(receipt.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-800">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Report Another Incident
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('first_aid')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>View First Aid Instructions</span>
                  </button>
                  {onSwitchToEOC && (
                    <button
                      onClick={onSwitchToEOC}
                      className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>EOC Command View</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Emergency Reporting Form */
            <div className="bg-[#0B1120] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl font-mono">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                
                {/* 1. Incident Category */}
                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-2">
                    1. Select Emergency Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'ROAD_ACCIDENT', label: 'Road Accident / Collision' },
                      { id: 'COLLAPSE', label: 'Sudden Collapse' },
                      { id: 'UNCONSCIOUSNESS', label: 'Unresponsive / Unconscious' },
                      { id: 'BREATHING_DIFFICULTY', label: 'Severe Breathing Distress' },
                      { id: 'MASS_CASUALTY', label: 'Mass Trauma / Pileup' },
                      { id: 'STRUCTURAL_FIRE', label: 'Fire / Hazmat Emergency' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setIncidentType(type.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          incidentType === type.id
                            ? 'bg-cyan-950/70 border-cyan-500 text-white font-bold shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                            : 'bg-black/40 border-gray-800 text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                        }`}
                      >
                        <span className="block text-[11px] leading-snug">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Structured Geographic Location & GPS Accuracy */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-bold uppercase">
                      2. Incident Location & GPS Verification
                    </label>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer bg-cyan-950/40 border border-cyan-500/40 px-2.5 py-1 rounded-lg"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Request Live GPS</span>
                    </button>
                  </div>

                  {/* Accuracy Badge */}
                  {isLocationVerified && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>GPS Coordinates Verified: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                      </div>
                      <span className="font-bold bg-emerald-900/60 px-2 py-0.5 rounded text-[10px]">
                        Radius: ±{locationAccuracy || 10} meters
                      </span>
                    </div>
                  )}

                  {/* Location Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {locationPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-lg border text-left text-[10px] transition-all cursor-pointer ${
                          locationName === preset.fullName
                            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold'
                            : 'bg-black/40 border-gray-800 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <div className="truncate font-semibold">{preset.label}</div>
                        <div className="text-[9px] text-gray-500">{preset.locality}</div>
                      </button>
                    ))}
                  </div>

                  {/* Full Location Input */}
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Full address / landmark / street intersection..."
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 font-sans"
                  />

                  {/* Hierarchy Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">District / City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setDistrict(e.target.value); }}
                        className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-[11px] font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Locality / Sector</label>
                      <input
                        type="text"
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-[11px] font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Landmark</label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-[11px] font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Voice Reporting & AI Transcription Pipeline */}
                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F293D] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-300 font-bold uppercase block text-xs">
                        3. Voice Note & Speech Description (Optional)
                      </label>
                      <span className="text-[10px] text-gray-400 font-sans">
                        Record voice audio; speech is transcribed and structured automatically.
                      </span>
                    </div>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Record Voice Note</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={stopVoiceRecording}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop ({recordingSeconds}s)</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelVoiceRecording}
                          className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {isTranscribing && (
                    <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-center gap-2">
                      <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Transcribing real speech audio...</span>
                    </div>
                  )}

                  {speechNotice && (
                    <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
                      <span>{speechNotice}</span>
                      <button 
                        type="button" 
                        onClick={() => setSpeechNotice(null)} 
                        className="text-amber-400 hover:text-amber-200 text-xs ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {voiceTranscript && (
                    <div className="p-3 bg-black/60 border border-gray-700 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase">
                        <span>Captured Speech Transcript (Editable • Unconfirmed)</span>
                        <span className="text-gray-500">Review & Correct</span>
                      </div>
                      <textarea
                        rows={2}
                        value={voiceTranscript}
                        onChange={(e) => {
                          setVoiceTranscript(e.target.value);
                          setDescription(e.target.value);
                        }}
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-xs text-gray-200 font-sans focus:outline-none focus:border-cyan-500"
                        placeholder="Review your transcribed voice note here..."
                      />
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>You can edit words above to correct locations or names.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setVoiceTranscript('');
                            setVoiceAudioBlob(null);
                          }}
                          className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          Discard Audio Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Text Description */}
                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-1.5">
                    4. Emergency Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe scene, vehicle damage, trapped individuals, observed bleeding or hazards..."
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
                  />
                </div>

                {/* 5. Casualties & Severity (Explicit Unknown Support) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-gray-300 font-bold uppercase text-xs">
                        5. Approximate Casualties
                      </label>
                      <label className="flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unknownCasualties}
                          onChange={(e) => setUnknownCasualties(e.target.checked)}
                          className="rounded border-gray-700 text-cyan-500 focus:ring-0"
                        />
                        <span>Exact count unknown</span>
                      </label>
                    </div>

                    {!unknownCasualties ? (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={patientCount}
                        onChange={(e) => setPatientCount(Number(e.target.value))}
                        className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-cyan-500"
                      />
                    ) : (
                      <div className="p-3 bg-black/40 border border-gray-800 rounded-xl text-amber-400 text-xs font-sans">
                        Reported as "Unconfirmed / Unknown". No synthetic patient records will be invented.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold uppercase mb-1.5">
                      6. Severity Indicator
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="CRITICAL">CRITICAL (Immediate Life Threat / Unconscious)</option>
                      <option value="HIGH">HIGH (Severe Trauma / Major Bleeding / Fractures)</option>
                      <option value="MEDIUM">MEDIUM (Stable / Minor Injuries)</option>
                      <option value="LOW">LOW (Non-Urgent Assistance)</option>
                    </select>
                  </div>
                </div>

                {/* 6. Photo Evidence Upload */}
                <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F293D] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-300 font-bold uppercase block text-xs">
                        7. Photo Evidence (Optional)
                      </label>
                      <span className="text-[10px] text-gray-400 font-sans">
                        Provide scene photos to assist EOC triage and responder routing.
                      </span>
                    </div>

                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="px-3 py-1.5 bg-[#141C2E] hover:bg-[#1C2538] border border-gray-700 rounded-lg text-xs text-gray-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{uploadingFile ? 'Uploading...' : 'Attach Photo'}</span>
                      </button>
                    </div>
                  </div>

                  {uploadedEvidence.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {uploadedEvidence.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-black/60 border border-gray-700 text-[11px]">
                          <span className="text-cyan-400">[{ev.category}]</span>
                          <span className="text-gray-300 truncate max-w-[150px]">{ev.filename}</span>
                          <span className="text-emerald-400 text-[10px]">✓ Uploaded</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. Informant Contact & Privacy Consent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Your Name</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Contact Callback Phone</label>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-xs font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-sans">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={reporterConsent}
                    onChange={(e) => setReporterConsent(e.target.checked)}
                    className="rounded border-gray-700 text-cyan-500 focus:ring-0"
                  />
                  <label htmlFor="consent">
                    I consent to share location and contact with authorized emergency dispatchers for response coordination.
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${submitting ? 'animate-bounce' : ''}`} />
                  {submitting ? 'TRANSMITTING REPORT TO OPERATIONS...' : 'SUBMIT EMERGENCY REPORT (ACID RECORD)'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: MEDICALLY REVIEWED FIRST AID GUIDANCE */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'first_aid' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Urgent Warning Header */}
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 font-sans space-y-1">
              <span className="font-bold block uppercase text-rose-300 font-mono">
                CRITICAL LIFE SAFETY DIRECTIVE
              </span>
              <span>
                Never delay contacting official emergency services (112 / 108 / 911) to read instructions. If safe, provide hands-on bystander support while waiting for responders.
              </span>
            </div>
          </div>

          {/* Decision Tree Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Road Accident Precautions */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">1. Road Traffic Collision Safety</h3>
              </div>
              <ul className="text-xs text-gray-300 font-sans space-y-2 list-disc list-inside leading-relaxed">
                <li><strong className="text-white font-mono">Secure Scene:</strong> Turn on vehicle hazard flashers. Set warning triangles 50m behind incident.</li>
                <li><strong className="text-white font-mono">Ignition Off:</strong> Switch off vehicle ignition to prevent sparks or fuel fire.</li>
                <li><strong className="text-white font-mono">Spinal Caution:</strong> Do NOT move trapped victims unless there is immediate fire/submersion risk.</li>
                <li><strong className="text-white font-mono">Helmets:</strong> Do NOT remove motorcycle helmets unless airway is completely blocked.</li>
              </ul>
            </div>

            {/* 2. Unresponsiveness & Recovery Position */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Activity className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">2. Unconsciousness & Breathing</h3>
              </div>
              <ul className="text-xs text-gray-300 font-sans space-y-2 list-disc list-inside leading-relaxed">
                <li><strong className="text-white font-mono">Check Response:</strong> Tap collarbones firmly and shout "Are you okay?".</li>
                <li><strong className="text-white font-mono">Check Breathing:</strong> Tilt head back gently, look for chest rise for 10 seconds.</li>
                <li><strong className="text-white font-mono">If Breathing Normally:</strong> Roll patient gently into Recovery Position on their side to keep airway clear.</li>
                <li><strong className="text-white font-mono">If NOT Breathing:</strong> Immediately initiate CPR compressions.</li>
              </ul>
            </div>

            {/* 3. Hands-Only CPR & AED */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <HeartHandshake className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">3. Hands-Only CPR & AED Guidance</h3>
              </div>
              <ul className="text-xs text-gray-300 font-sans space-y-2 list-disc list-inside leading-relaxed">
                <li><strong className="text-white font-mono">Hand Placement:</strong> Place heel of hand in center of chest; interlock other hand on top.</li>
                <li><strong className="text-white font-mono">Rate & Depth:</strong> Push hard and fast at 100-120 beats/min (to beat of "Stayin' Alive"), 2 inches deep.</li>
                <li><strong className="text-white font-mono">Full Recoil:</strong> Allow chest to rise completely between compressions.</li>
                <li><strong className="text-white font-mono">Use AED:</strong> If an automated external defibrillator is available, turn it on and follow voice prompts.</li>
              </ul>
            </div>

            {/* 4. Severe Bleeding Control */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">4. Severe Bleeding & Hemorrhage</h3>
              </div>
              <ul className="text-xs text-gray-300 font-sans space-y-2 list-disc list-inside leading-relaxed">
                <li><strong className="text-white font-mono">Direct Pressure:</strong> Press firmly on wound using sterile gauze or cleanest cloth available.</li>
                <li><strong className="text-white font-mono">Maintain Continuous Pressure:</strong> Do NOT remove soaked dressings; layer new dressings on top.</li>
                <li><strong className="text-white font-mono">Limb Elevation:</strong> Elevate injured limb above heart level if no fracture is suspected.</li>
                <li><strong className="text-white font-mono">Tourniquet Protocol:</strong> For catastrophic arterial limb bleeding, apply tourniquet 2-3 inches above wound.</li>
              </ul>
            </div>

            {/* 5. Burns & Scalds */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Flame className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">5. Thermal & Chemical Burns</h3>
              </div>
              <ul className="text-xs text-gray-300 font-sans space-y-2 list-disc list-inside leading-relaxed">
                <li><strong className="text-white font-mono">Cool Immediately:</strong> Run cool clean tap water over burn for at least 20 minutes.</li>
                <li><strong className="text-white font-mono">Never Use Ice:</strong> Do NOT use ice, butter, grease, or toothpaste on burns.</li>
                <li><strong className="text-white font-mono">Cover Loosely:</strong> Protect with clean plastic cling wrap or non-adherent sterile dressing.</li>
                <li><strong className="text-white font-mono">Chemical Exposures:</strong> Flush with copious clean water; remove contaminated clothing.</li>
              </ul>
            </div>

            {/* 6. Suspected Fractures & Head Trauma */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <LifeBuoy className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">6. Fractures & Head Trauma</h3>
              </div>
              <ul className="text-xs text-gray-300 font-sans space-y-2 list-disc list-inside leading-relaxed">
                <li><strong className="text-white font-mono">Immobilize:</strong> Support injured limb in position found. Do not attempt to straighten deformed bones.</li>
                <li><strong className="text-white font-mono">Head Injury:</strong> Keep patient calm and still. Monitor for vomiting, confusion, or pupil asymmetry.</li>
                <li><strong className="text-white font-mono">Cold Compress:</strong> Apply cold pack wrapped in towel to reduce swelling.</li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: MY INCIDENTS & DURABLE STATUS TRACKER */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'my_incidents' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Quick Tracking Search Box */}
          <div className="p-4 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Track Any Incident by Tracking Code</span>
              <span className="text-[10px] text-gray-500 font-mono">FORMAT: TRK-XXXX-XXXX</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/60 border border-gray-700 rounded-xl px-3 py-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TRK-A1B2-C3D4 or TRK-SEED-0001"
                  className="bg-transparent text-gray-200 text-xs focus:outline-none w-full font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => openTrackerForCode(searchCode)}
                disabled={trackingLoading || !searchCode.trim()}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all"
              >
                {trackingLoading ? 'Checking...' : 'Track'}
              </button>
            </div>

            {trackingError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-xs text-red-300 rounded-xl">
                {trackingError}
              </div>
            )}
          </div>

          {/* Persisted Reports List */}
          <div className="bg-[#0E1524] border border-[#1F293D] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Incidents Logged in Coordination Database ({myReports.length})
                </h3>
              </div>
              <button
                onClick={fetchMyReports}
                disabled={loadingReports}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141C2E] hover:bg-[#1C2538] border border-gray-700 text-[11px] text-gray-300 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingReports ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {myReports.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 space-y-2">
                <div>No reports logged under your session yet.</div>
                <button
                  onClick={() => setActiveTab('emergency')}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Report an Incident Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] border-b border-[#1F293D]">
                    <tr>
                      <th className="p-3">Tracking Code</th>
                      <th className="p-3">Type & Location</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Coordination Status</th>
                      <th className="p-3">Reported At</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F293D] text-gray-300">
                    {myReports.map((inc) => (
                      <tr key={inc.incident_id} className="hover:bg-[#141C2E]/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-cyan-300">
                          {inc.tracking_code || inc.incident_id}
                        </td>
                        <td className="p-3 font-sans max-w-[240px]">
                          <div className="font-semibold text-white truncate">{inc.location_name}</div>
                          <div className="text-[10px] text-gray-400">{inc.incident_type.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            inc.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-500/50' : 'bg-amber-950 text-amber-300 border-amber-500/50'
                          }`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                            inc.status === 'RECEIVED' 
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 animate-pulse'
                              : inc.status === 'VERIFIED'
                              ? 'bg-blue-950 text-blue-300 border-blue-500/50'
                              : inc.status === 'ACTIVE' || inc.status === 'ASSIGNED' || inc.status === 'EN_ROUTE'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              : 'bg-gray-800 text-gray-300 border-gray-600'
                          }`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-gray-400 font-mono">
                          {new Date(inc.reported_at || inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => openTrackerForCode(inc.tracking_code || inc.incident_id)}
                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold cursor-pointer"
                          >
                            Live View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: LEARN & LEGAL PROTECTIONS (Good Samaritan) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'learn' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0E1524] to-[#141C2E] border border-cyan-500/40 space-y-3">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/40">
              GOOD SAMARITAN LEGAL PROTECTION
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              You Are Protected When Assisting Emergency Victims
            </h2>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Under Good Samaritan laws (and India Supreme Court Directives / Section 134A Motor Vehicles Act), citizens who voluntarily assist accident victims in good faith cannot be harassed, interrogated unnecessarily by police, or held civilly liable for unintended complications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">No Hospital Detention</h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Hospitals cannot demand monetary deposits or detain a bystander who brings an injured victim for emergency care.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">Voluntary Disclosure</h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Providing personal details to police is optional. Informants have the legal right to remain anonymous if they prefer.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <PhoneCall className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Direct EOC Linkage</h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Every report submitted via TERA creates a tamper-proof timestamped audit trail directly visible to Control Operators.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Public Tracker Modal */}
      {isTrackerModalOpen && activeTrackedIncident && (
        <PublicTrackerModal
          incident={activeTrackedIncident}
          onClose={() => setIsTrackerModalOpen(false)}
        />
      )}
    </div>
  );
};
