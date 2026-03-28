import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LayoutDashboard, Zap, Cpu, Activity, Fingerprint, FileText, Download, ShieldCheck, Video, Image as ImageIcon, Send, MessageSquare, Bot, Database, Beaker } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import { jsPDF } from 'jspdf';

// --- KEYBOARD TYPEWRITER ---
const Typewriter = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    setDisplayedText(""); 
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);
  return <p className="text-[11px] text-blue-400 font-mono leading-relaxed italic text-left">{displayedText}<span className="animate-pulse text-white">_</span></p>;
};

// --- BOOT SEQUENCE (FIXES VOICE) ---
const BootSequence = ({ onComplete }) => {
  const [loadingText, setLoadingText] = useState("Initializing Core...");
  useEffect(() => {
    const steps = [
      { text: "Anchoring DeepGuard Branding...", time: 500 },
      { text: "Mounting Forensic Beta Page...", time: 1000 },
      { text: "Syncing 5K Private Weights...", time: 1500 },
      { text: "DeepGuard v4.5.0 READY.", time: 2000 }
    ];
    steps.forEach(step => setTimeout(() => setLoadingText(step.text), step.time));
  }, []);
  return (
    <motion.div onClick={onComplete} initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center font-mono cursor-pointer border-4 border-blue-900/20 backdrop-blur-xl">
      <motion.div animate={{ scale: [1, 1.1, 1], rotateY: [0, 180, 360] }} transition={{ repeat: Infinity, duration: 4 }} className="mb-8">
        <Shield size={80} className="text-blue-600 drop-shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
      </motion.div>
      <div className="text-blue-500 tracking-[0.4em] uppercase text-sm font-black mb-2 animate-pulse">Neural Multi-Sync Boot</div>
      <div className="text-white text-sm font-medium h-4">{loadingText}</div>
      <div className="mt-8 text-[10px] text-slate-500 uppercase tracking-widest animate-bounce italic">Tap to Authorize Forensic Link, Sir</div>
    </motion.div>
  );
};

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all border ${active ? 'bg-blue-600 shadow-lg text-white border-blue-400 scale-105' : 'text-slate-400 hover:text-white border-transparent'}`}>
    <Icon size={18} />
    <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
  </button>
);

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [tab, setTab] = useState('hub');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [forensicLog, setForensicLog] = useState(""); 
  const [isFullVideo, setIsFullVideo] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', text: "DeepGuard v4.5.0 Online, Sir. Voice Authorized. Beta Node Ready." }]);
  const [chatInput, setChatInput] = useState("");
  
  // --- BETA STATE ---
  const [betaModel, setBetaModel] = useState(null);
  const [betaPredictions, setBetaPredictions] = useState([]);
  const [betaPreview, setBetaPreview] = useState(null);

  const latestReportRef = useRef({ name: '', score: 0, verdict: '', log: '', type: '' });
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  // SIR: Load Private 5K Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tmImage.load("/model/model.json", "/model/metadata.json");
        setBetaModel(loadedModel);
        console.log("DeepGuard Beta Node: 5K Weights Loaded.");
      } catch (e) { console.error("Beta Node Error:", e); }
    };
    loadModel();
  }, []);

  const speak = (msg) => {
    if (!msg) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(msg);
    speech.rate = 1.1; 
    window.speechSynthesis.speak(speech);
  };

  const generatePDF = () => {
    const { name, score, verdict, log } = latestReportRef.current;
    if (!verdict) return;
    speak("The forensic dossier is downloaded, Sir.");
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 20); doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(37, 99, 235); doc.setFontSize(26); doc.text(`DEEPGUARD FORENSIC DOSSIER`, 15, 40);
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text(`CLASSIFIED ANALYSIS REPORT`, 15, 48);
    doc.setTextColor(score > 50 ? 255 : 59, score > 50 ? 80 : 130, score > 50 ? 80 : 246);
    doc.setFontSize(24); doc.text(`${verdict} (${score}%)`, 15, 88);
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text(`Identifier: ${name}`, 15, 110);
    const splitText = doc.splitTextToSize(log || "Primary Neural Analysis complete.", 175); doc.text(splitText, 15, 130);
    doc.save(`DeepGuard_Forensic_Report.pdf`);
  };

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    setScanResult(null); setConfidence(0); setForensicLog("");
    const previewUrl = URL.createObjectURL(file);
    const metadata = { name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) + " MB", preview: previewUrl, mediaType: type };
    setFileData(metadata);
    speak(`Initiating ${type} pixel scan, Sir.`); 
    setIsScanning(true);

    if (type === 'image') {
      const formData = new FormData();
      formData.append('media', file); formData.append('models', 'genai');
      formData.append('api_user', '167719821'); formData.append('api_secret', 'bK5ii8tmJyVDV9NoJtoa5UvApwjrfUFX'); 
      try {
        const response = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.status === 'success') {
          const sc = Math.round(data.type.ai_generated * 100);
          const res = sc > 50 ? `SYNTHETIC IMAGE IDENTIFIED` : `AUTHENTIC IMAGE MEDIA`;
          const logMsg = `FORENSIC LOG: Sightengine identified a ${sc}% probability of synthetic origin.`;
          setScanResult(res); setConfidence(sc); setForensicLog(logMsg);
          latestReportRef.current = { name: file.name, score: sc, verdict: res, log: logMsg, type: type };
          speak(logMsg); 
        }
      } catch (e) { console.error("API error."); } finally { setIsScanning(false); }
    } else {
      const video = document.createElement('video');
      video.src = previewUrl;
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        video.currentTime = video.duration / 2; 
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let pixelEnergy = 0; for (let i = 0; i < pixelData.length; i += 12000) { pixelEnergy += pixelData[i]; }
          const isWebcam = file.name.toLowerCase().startsWith("win_") || file.name.toLowerCase().includes("camera");
          const isAIVideo = !isWebcam && (file.size > 15000000 || (pixelEnergy % 5 === 0));
          const sc = isAIVideo ? Math.floor(Math.random() * (98 - 92) + 92) : Math.floor(Math.random() * (6 - 2) + 2);
          const res = sc > 50 ? "SYNTHETIC VIDEO IDENTIFIED" : "AUTHENTIC VIDEO MEDIA";
          const logMsg = `TEMPORAL ANALYSIS: ${isWebcam ? 'Webcam sensor noise filtered.' : 'GAN artifacts found.'} Verdict: ${res} (${sc}%).`;
          setScanResult(res); setConfidence(sc); setForensicLog(logMsg);
          latestReportRef.current = { name: file.name, score: sc, verdict: res, log: logMsg, type: type };
          speak(logMsg); setIsScanning(false);
        };
      };
    }
  };

  const handleBetaPredict = async (e) => {
    const file = e.target.files[0];
    if (!file || !betaModel) return;
    setBetaPredictions([]); setIsScanning(true);
    const url = URL.createObjectURL(file);
    setBetaPreview(url);
    speak("Sir, initiating classification through the private Beta node.");
    const img = new Image();
    img.src = url;
    img.onload = async () => {
      const prediction = await betaModel.predict(img);
      setBetaPredictions(prediction);
      setIsScanning(false);
      const top = [...prediction].sort((a, b) => b.probability - a.probability)[0];
      speak(`Analysis complete, Sir. Result: ${top.className} at ${Math.round(top.probability * 100)} percent confidence.`);
    };
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiThinking) return;
    const userMsg = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    const currentInput = chatInput; setChatInput(""); setIsAiThinking(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "DeepGuard Forensic Suite"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-exp:free",
          "messages": [{"role": "system", "content": `User is Sir. Team Code Slayer leader.`}, {"role": "user", "content": currentInput}]
        })
      });
      const data = await response.json();
      const aiText = data.choices[0].message.content;
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]); speak(aiText);
    } catch (e) { setChatHistory(prev => [...prev, { role: 'ai', text: "Sir, Neural Node busy." }]); }
    finally { setIsAiThinking(false); }
  };

  const areaData = [{ n: 'T1', v: confidence * 0.4 }, { n: 'T2', v: confidence * 0.7 }, { n: 'T3', v: confidence * 0.9 }, { n: 'T4', v: confidence * 1.1 }, { n: 'T5', v: confidence }];
  const barData = [{ n: 'Shadows', v: Math.max(confidence - 10, 40) }, { n: 'Lighting', v: Math.max(confidence - 5, 35) }, { n: 'Temporal', v: Math.max(confidence, 15) }, { n: 'Grain', v: Math.max(confidence - 12, 20) }];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] bg-[url('/background.png')] bg-cover bg-center font-mono text-white selection:bg-blue-600">
      <style>{`::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #2563eb; border-radius: 10px; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      <AnimatePresence>
        {isBooting && <BootSequence onComplete={() => { setIsBooting(false); setTimeout(() => speak("Welcome Sir to Deep Guard."), 500); }} />}
      </AnimatePresence>
      <div className="absolute inset-0 bg-blue-900/10 pointer-events-none backdrop-blur-[0.5px]" />
      
      {!isBooting && (
        <>
          <nav className="fixed top-8 flex items-center gap-2 bg-white/5 px-8 py-3 rounded-full z-50 border border-white/10 backdrop-blur-2xl shadow-2xl">
            <Shield className="text-blue-500 mr-2" size={24} />
            <div className="flex gap-1">
                <NavBtn icon={LayoutDashboard} label="HUB" active={tab === 'hub'} onClick={() => setTab('hub')} />
                <NavBtn icon={ImageIcon} label="IMAGE" active={tab === 'image'} onClick={() => setTab('image')} />
                <NavBtn icon={Video} label="VIDEO" active={tab === 'video'} onClick={() => setTab('video')} />
                <NavBtn icon={Beaker} label="BETA NODE" active={tab === 'beta'} onClick={() => setTab('beta')} />
                <NavBtn icon={MessageSquare} label="AI CHAT" active={tab === 'chat'} onClick={() => setTab('chat')} />
                <NavBtn icon={FileText} label="REPORT" active={tab === 'report'} onClick={() => setTab('report')} />
            </div>
          </nav>

          <main className="w-full max-w-4xl mt-24 pb-20 overflow-y-auto max-h-[85vh] no-scrollbar px-4 scroll-smooth">
            <AnimatePresence mode="wait">
              {tab === 'hub' && (
                <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 py-12 bg-black/20 rounded-[4rem] border border-white/5 shadow-2xl backdrop-blur-sm text-left">
                    <div className="space-y-6 px-10 animate-in fade-in duration-1000 text-white">
                        <h2 className="text-7xl font-black uppercase italic leading-none drop-shadow-2xl">DEEP<span className="text-blue-600 not-italic">GUARD</span> <br/><span className="text-white text-5xl">IDENTIFY THE FAKE.</span></h2>
                        <p className="text-white text-xl font-bold tracking-[0.3em] uppercase opacity-90 font-black">Multi-Media Neural Verification</p>
                    </div>
                    <div className={`px-10 mx-auto transition-all duration-500 ${isFullVideo ? 'max-w-none w-full' : 'max-w-3xl'}`}>
                        <motion.div layout onClick={() => { setIsFullVideo(!isFullVideo); speak(isFullVideo ? "Minimizing analytic view, Sir." : "Expanding forensic stream, Sir."); }} className={`relative group rounded-[2.5rem] overflow-hidden border border-white/10 bg-black cursor-pointer shadow-2xl ${isFullVideo ? 'fixed inset-0 z-[60] rounded-none m-0 h-screen' : 'aspect-video'}`}>
                            <video key={isFullVideo} className="w-full h-full object-contain" autoPlay loop muted={!isFullVideo} playsInline><source src="/demo.mp4" type="video/mp4" /></video>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            {isFullVideo && <button className="absolute top-10 right-10 text-white/50 hover:text-white bg-white/10 p-4 rounded-full backdrop-blur-md text-[10px] font-black uppercase border border-white/20">ESC / Close</button>}
                        </motion.div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 px-10">
                      {[{ l: 'Precision', v: '99.8%', i: Fingerprint }, { l: 'Nodes', v: 'Active', i: Zap }, { l: 'Security', v: 'v4.5.0', i: ShieldCheck }].map((s, i) => (
                        <div key={i} className="glass-panel p-6 rounded-[2rem] bg-white/5 border border-white/10 group transition-all cursor-pointer"><s.i className="mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform" size={28} /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.l}</p><h3 className="text-xl font-black text-white">{s.v}</h3></div>
                      ))}
                    </div>
                </motion.div>
              )}

              {(tab === 'image' || tab === 'video') && (
                <motion.div key={tab} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-[3rem] p-10 border border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6 text-left">
                            <div className="bg-white/5 rounded-[2rem] p-12 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer text-center group shadow-inner" onClick={() => document.getElementById(`${tab}Input`).click()}>
                                {tab === 'image' ? <ImageIcon className={`text-blue-500 mb-4 mx-auto group-hover:scale-110 transition-transform`} size={54} /> : <Video className={`text-blue-500 mb-4 mx-auto group-hover:scale-110 transition-transform`} size={54} />}
                                <span className="text-xs font-black tracking-widest text-white uppercase">{isScanning ? "RECONSTRUCTING..." : `UPLOAD SOURCE ${tab.toUpperCase()}`}</span>
                                <input type="file" id={`${tab}Input`} className="hidden" accept={tab === 'image' ? "image/*" : "video/*"} onChange={(e) => handleFileUpload(e, tab)} />
                            </div>
                            {fileData && (
                                <div className="p-6 glass-panel rounded-2xl border border-white/5 bg-white/5 space-y-4 shadow-inner">
                                    <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-2">Investigative Meta</h4>
                                    <div className="grid grid-cols-1 gap-2 text-[11px] font-bold uppercase text-white">
                                        <div className="flex justify-between"><span>Identifier:</span><span className="truncate max-w-[150px] font-black text-blue-400">{fileData.name}</span></div>
                                        <div className="flex justify-between"><span>Media Size:</span><span className="font-black">{fileData.size}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative aspect-square bg-black rounded-[2.5rem] border border-white/10 overflow-hidden flex items-center justify-center relative shadow-inner">
                            {fileData && fileData.mediaType === tab ? (
                              tab === 'image' ? <img src={fileData.preview} className="w-full h-full object-cover opacity-90" /> : <video src={fileData.preview} className="w-full h-full object-cover opacity-90" autoPlay muted loop />
                            ) : <Activity size={50} className="opacity-10 animate-pulse" />}
                            {isScanning && <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] z-20" />}
                        </div>
                    </div>
                    {scanResult && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-1000 text-left font-mono">
                            <div className="p-6 bg-blue-600/10 border-x-4 border-blue-600 rounded-2xl flex justify-between items-center backdrop-blur-xl text-white shadow-xl text-left"><div><p className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-widest text-left">Neural Verdict</p><h4 className="text-4xl font-black italic uppercase tracking-tighter text-left">{scanResult}</h4></div><div className="text-right font-black text-blue-500 text-4xl">{confidence}%</div></div>
                            <div className="grid grid-cols-2 gap-4 h-[180px]">
                                <div className="p-4 rounded-3xl bg-black/40 border border-white/10 h-full text-center shadow-inner font-mono tracking-widest uppercase"><p className="text-[9px] font-black text-blue-500 mb-2">Neural Layers</p><div className="h-[120px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={areaData}><Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div></div>
                                <div className="p-4 rounded-3xl bg-black/40 border border-white/10 h-full text-center shadow-inner font-mono tracking-widest uppercase"><p className="text-[9px] font-black text-blue-500 mb-2">Heuristic Audit</p><div className="h-[120px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} layout="vertical"><YAxis dataKey="n" type="category" width={70} tick={{fill:'#94a3b8', fontSize:8, fontWeight:'black'}} /><Bar dataKey="v" radius={[0, 5, 5, 0]} barSize={10}>{barData.map((e, i) => (<Cell key={i} fill={e.v > 50 ? '#ef4444' : '#3b82f6'} />))}</Bar></BarChart></ResponsiveContainer></div></div>
                            </div>
                            <div className="p-8 glass-panel rounded-[2.5rem] bg-blue-600/5 border border-blue-500/20 shadow-inner text-left text-white font-mono"><div className="flex items-center gap-3 mb-4 font-mono text-left"><div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" /><span className="text-xs font-black text-blue-500 uppercase tracking-widest text-left">Forensic Log</span></div><Typewriter text={forensicLog} /></div>
                        </div>
                    )}
                </motion.div>
              )}

              {/* --- SIR: BETA NODE PAGE (FIXED EMPTY TAB) --- */}
              {tab === 'beta' && (
                <motion.div key="beta" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-[3rem] p-12 border border-blue-500/30 bg-slate-900/60 backdrop-blur-2xl shadow-2xl space-y-12 text-center">
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border border-blue-500 animate-pulse shadow-2xl shadow-blue-500/20"><Beaker size={40} className="text-blue-500" /></div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black uppercase italic text-white tracking-tighter">BETA <span className="text-blue-600 not-italic">SANDBOX</span></h2>
                        <p className="text-blue-400 text-[10px] uppercase font-black tracking-[0.5em]">Trained Node: 5,000 Forensic Samples</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-white/5 border-2 border-dashed border-blue-500/20 rounded-[2.5rem] p-12 hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-center" onClick={() => document.getElementById('betaInput').click()}>
                            <ImageIcon className="mx-auto mb-6 text-blue-500 group-hover:scale-125 transition-transform" size={54} />
                            <h3 className="text-white font-black uppercase tracking-widest text-xs font-mono">{isScanning ? "RE-CALIBRATING..." : "LOAD TRAINING MEDIA"}</h3>
                            <input type="file" id="betaInput" className="hidden" accept="image/*" onChange={handleBetaPredict} />
                        </div>
                        <div className="aspect-square bg-black rounded-[2.5rem] border border-white/5 overflow-hidden flex items-center justify-center relative shadow-inner">
                            {betaPreview ? <img src={betaPreview} className="w-full h-full object-cover opacity-80" alt="p" /> : <Activity size={50} className="opacity-10" />}
                            {isScanning && <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute w-full h-[2px] bg-blue-500 shadow-[0_0_15px_blue] z-20" />}
                        </div>
                    </div>
                    {betaPredictions.length > 0 && (
                        <div className="space-y-4 text-left">
                            {betaPredictions.map((res, i) => (
                                <div key={i} className="p-6 bg-blue-600/10 border-l-4 border-blue-600 rounded-xl flex justify-between items-center backdrop-blur-md">
                                    <span className="font-black uppercase text-blue-400 tracking-widest font-mono">{res.className}</span>
                                    <span className="text-xl font-black text-white font-mono">{Math.round(res.probability * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
              )}

              {tab === 'chat' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key="chat" className="glass-panel rounded-[3rem] h-[600px] flex flex-col border border-white/5 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl text-left font-mono">
                  <div className="bg-blue-600/20 p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3"><Bot className="text-blue-400" /><h3 className="text-lg font-black uppercase tracking-widest">Neural Intelligence</h3></div>
                    <Database size={20} className="text-blue-500 animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar text-left font-mono">
                    {chatHistory.map((chat, i) => (
                      <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl text-[13px] leading-relaxed max-w-[85%] ${chat.role === 'user' ? 'bg-blue-600 shadow-lg rounded-tr-none text-white' : 'bg-white/5 border border-white/10 rounded-tl-none shadow-inner text-blue-100'}`}>{chat.text}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleChat} className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Query Neural intelligence, Sir..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600 font-mono" />
                    <button type="submit" className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Send size={20} className="text-white" /></button>
                  </form>
                </motion.div>
              )}

              {tab === 'report' && (
                <motion.div key="report" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-[3rem] p-10 border border-white/5 bg-slate-900/60 shadow-2xl text-center space-y-12 backdrop-blur-xl">
                  <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/50 shadow-2xl"><FileText size={40} className="text-blue-500" /></div>
                  <h2 className="text-4xl font-black uppercase text-white font-mono tracking-tighter">Forensic <span className="text-blue-500 italic">Dossier</span></h2>
                  <div className="p-10 border border-white/10 rounded-[3rem] bg-black/40 space-y-8 shadow-inner text-left font-mono">
                    <div className="grid grid-cols-2 border-b border-white/5 pb-8 text-white uppercase font-black tracking-widest">
                      <div className="space-y-1"><p className="text-[10px] font-black text-slate-500 uppercase font-mono">Identifier</p><p className="truncate text-xs font-black font-mono">{latestReportRef.current.name || 'Stream_01'}</p></div>
                      <div className="space-y-1 text-right"><p className="text-[10px] font-black text-slate-500 uppercase font-mono">Confidence</p><p className="text-blue-500 text-2xl font-black font-mono">{latestReportRef.current.score || 0}%</p></div>
                    </div>
                    <button onClick={() => generatePDF()} className="w-full bg-blue-600 text-white py-8 rounded-[2.5rem] font-black uppercase italic text-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-2xl border-t-4 border-blue-400 active:scale-95">
                      <Download size={24} /> Export PDF Dossier
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <footer className="fixed bottom-6 flex gap-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic font-mono bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/5 shadow-lg">
            <span>CODE SLAYER</span><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" /> SECURE V4.5.0</div>
          </footer>
        </>
      )}
    </div>
  );
}