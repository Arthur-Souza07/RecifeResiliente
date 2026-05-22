import React, { useState, useEffect, useRef } from "react";
import { CrisisState } from "./types";
import DashboardView from "./components/DashboardView";
import PortalView from "./components/PortalView";
import SettingsView from "./components/SettingsView";
import Logo from "./components/Logo";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  HelpCircle,
  Activity,
  HeartHandshake,
  Mic,
  MicOff,
  LogOut,
  Settings
} from "lucide-react";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [loginInput, setLoginInput] = useState<string>("");
  
  // App views
  const [activeTab, setActiveTab] = useState<"portal" | "dashboard" | "configuracoes">("portal");
  const [crisisState, setCrisisState] = useState<CrisisState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Speech Recognition Accessibility State
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  // Load and configure theme and phone number from localstorage
  useEffect(() => {
    const savedPhone = localStorage.getItem("recife_phone_login");
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      setLoginInput(savedPhone);
      setIsLoggedIn(true);
    }

    const savedTheme = localStorage.getItem("recife_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    } else {
      setTheme("light"); // normal, beautiful Light Mode as default
    }
  }, []);

  // Timer for the animated splash entrance screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Live Clock BRT
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("pt-BR") + " BRT");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch state on mount and intervals
  const fetchCrisisState = async () => {
    try {
      const response = await fetch("/api/crisis-state");
      if (!response.ok) {
        throw new Error("Falha ao carregar estado do servidor.");
      }
      const data: CrisisState = await response.json();
      setCrisisState(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível conectar ao servidor de dados. Recarregue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrisisState();
    const interval = setInterval(fetchCrisisState, 15000);
    return () => clearInterval(interval);
  }, []);

  // Voice Recognition Setup (Acessibilidade)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "pt-BR";

        rec.onresult = (event: any) => {
          const resultIndex = event.resultIndex;
          const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
          setVoiceTranscript(transcript);
          handleVoiceCommand(transcript);
        };

        rec.onerror = (event: any) => {
          console.error("Erro no reconhecimento de voz:", event.error);
        };

        rec.onend = () => {
          if (isVoiceActive) {
            try {
              rec.start();
            } catch (e) {
              console.log(e);
            }
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, [isVoiceActive]);

  const handleVoiceCommand = (command: string) => {
    console.log("Comando de voz recebido:", command);
    let feedbackText = "";

    if (command.includes("portal") || command.includes("cidadão") || command.includes("cidadã")) {
      setActiveTab("portal");
      feedbackText = "Navegando para o portal do cidadão.";
    } else if (command.includes("gabinete") || command.includes("painel") || command.includes("interno") || command.includes("dashboard")) {
      setActiveTab("dashboard");
      feedbackText = "Indo para o painel de controle do gabinete de crise.";
    } else if (command.includes("configura") || command.includes("ajuste") || command.includes("tema") || command.includes("escuro")) {
      setActiveTab("configuracoes");
      feedbackText = "Abrindo painel de configurações e ajustes.";
    } else if (command.includes("sair") || command.includes("deslogar")) {
      handleLogout();
      feedbackText = "Efetuando saída da conta cadastrada.";
    } else if (command.includes("leitura") || command.includes("ler") || command.includes("estatística")) {
      if (crisisState) {
        feedbackText = `Atualmente temos ${crisisState.incidents.filter(i => i.status !== "resolvido").length} ocorrências e ${crisisState.sensors.filter(s => s.status === "critico").length} rios operando acima da capacidade crítica.`;
      } else {
        feedbackText = "O painel de dados está sendo carregado.";
      }
    } else if (command.includes("ajuda") || command.includes("instrução") || command.includes("comandos")) {
      feedbackText = "Comandos de voz: fale 'portal', 'gabinete', 'configurações', 'leitura' para narrar telas, ou 'sair'.";
    } else {
      feedbackText = `Texto interpretado: ${command}. Diga 'ajuda' para comandos de controle de voz.`;
    }

    if (feedbackText && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(feedbackText);
      utterance.lang = "pt-BR";
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceService = () => {
    if (!recognitionRef.current) {
      alert("Seu navegador atual não dá suporte nativo ao reconhecimento de voz da Web Speech API. Recomendamos Google Chrome.");
      return;
    }

    const nextState = !isVoiceActive;
    setIsVoiceActive(nextState);

    if (nextState) {
      try {
        recognitionRef.current.start();
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance("Controle e comando por voz ativado. Fale 'portal', 'gabinete', 'configurações' ou peça ajuda.");
          u.lang = "pt-BR";
          window.speechSynthesis.speak(u);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        recognitionRef.current.stop();
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance("Comando por voz desativado.");
          u.lang = "pt-BR";
          window.speechSynthesis.speak(u);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateIncident = async (id: string, status: string, agency: string) => {
    try {
      const response = await fetch(`/api/incident/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, agencyAssigned: agency })
      });
      if (response.ok) {
        await fetchCrisisState();
      }
    } catch (err) {
      console.error("Erro ao atualizar ocorrência:", err);
    }
  };

  const handleSubmitIncident = async (formData: any) => {
    const response = await fetch("/api/incident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (!response.ok) {
      throw new Error("Falha ao registrar ocorrência.");
    }
    await fetchCrisisState();
  };

  const handlePhoneFormat = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 11) {
      let formatted = clean;
      if (clean.length > 2) {
        formatted = `(${clean.slice(0, 2)}) ` + clean.slice(2);
      }
      if (clean.length > 7) {
        formatted = `(${clean.slice(0, 2)}) ` + clean.slice(2, 7) + "-" + clean.slice(7);
      }
      setLoginInput(formatted);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = loginInput.trim();
    if (cleanNum.length < 10) {
      alert("Por favor insira um celular válido do Recife.");
      return;
    }
    setPhoneNumber(cleanNum);
    localStorage.setItem("recife_phone_login", cleanNum);
    setIsLoggedIn(true);

    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Acesso autorizado. Bem-vindo.");
      u.lang = "pt-BR";
      window.speechSynthesis.speak(u);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("recife_phone_login");
    setPhoneNumber("");
    setLoginInput("");
    setIsLoggedIn(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("recife_theme", nextTheme);
  };

  const isDark = theme === "dark";

  // 1. SPLASH ENTRANCE SCREEN (Framer Motion Animation)
  if (showSplash || loading) {
    const statusText = loading 
      ? "Sincronizando frotas, tabelas e sensores..." 
      : "Iniciando Canal Integrado...";
      
    return (
      <div className="min-h-screen bg-[#07080c] grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-100 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.11)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center relative z-10 text-center"
        >
          {/* Accent lighting glow */}
          <div className="absolute -inset-1 rounded-full bg-cyan-500/20 blur-xl opacity-30 animate-pulse pointer-events-none" />
          
          <Logo layout="vertical" size="lg" isDarkBg={true} className="relative z-10" />
          
          {/* Custom micro loading bar */}
          <div className="w-56 h-1 bg-zinc-900 rounded-full mt-12 overflow-hidden relative border border-white/5">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.25em] mt-5 animate-pulse flex items-center gap-2 justify-center"
          >
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
            {statusText}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // 2. LUXURY ANIMATED PHONE/DDD LOGIN SCREEN (Always dark slate themed for premium feeling)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#090b11] grid-bg text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-[#38bdf8]/35 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06)_0%,transparent_65%)] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm bg-[#0e1017] border border-zinc-800/40 p-8 shadow-2xl relative overflow-hidden text-center space-y-6"
        >
          {/* Subtle logo header line stripe */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-sky-400 to-emerald-400" />
          
          <div className="pt-2">
            <Logo layout="vertical" size="md" isDarkBg={true} />
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left pt-2">
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-2 uppercase font-semibold tracking-wider">
                Número de Celular com DDD
              </label>
              <input
                type="tel"
                value={loginInput}
                onChange={(e) => handlePhoneFormat(e.target.value)}
                placeholder="Ex: (81) 98888-7766"
                className="w-full bg-black/60 text-center text-sm font-mono text-white border border-zinc-800 focus:border-[#8b5cf6]/60 rounded-none py-3 outline-none transition-all placeholder-zinc-600 focus:ring-1 focus:ring-[#8b5cf6]/20"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-950 to-indigo-950 hover:from-violet-900 hover:to-indigo-900 border border-[#8b5cf6]/40 text-white font-mono text-xs font-bold py-3.5 tracking-wider uppercase transition-all rounded-none cursor-pointer active:scale-[0.98] shadow-md"
            >
              Entrar no Sistema
            </button>
          </form>

          <p className="text-[9px] text-zinc-500 leading-normal font-sans pt-2 border-t border-zinc-900">
            A autenticação assegura a integridade civil e o monitoramento contra desinformação pela Defesa Civil da Prefeitura do Recife.
          </p>
        </motion.div>
      </div>
    );
  }

  // 3. CORE APPLET WORKSPACE CONTAINER
  return (
    <div
      className={`min-h-screen font-sans flex flex-col transition-colors duration-300 relative ${
        isDark ? "bg-[#0b0c11] text-slate-100" : "bg-[#f4f6fc] text-slate-800"
      }`}
    >
      <div className="scanline opacity-10" />
      
      {/* Polished Navigation Header */}
      <header
        className={`border-b border-x rounded-b-2xl flex items-center justify-between px-4 sm:px-10 z-20 sticky top-0 py-3 transition-colors duration-300 shadow-xs ${
          isDark ? "bg-[#0c0d12]/95 border-zinc-800/80 backdrop-blur-md" : "bg-white/95 border-slate-200/80 shadow-xs backdrop-blur-md"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Main Title branding - official layout-horizontal logo */}
          <div className="flex items-center gap-3">
            <Logo layout="horizontal" size="sm" isDarkBg={isDark} />
          </div>

          {/* Minimalist Subtitle / Status Badge */}
          <div className="hidden md:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              CONEXÃO ATIVA PCR • DEFESA CIVIL
            </span>
          </div>

          {/* Right Navigation controls */}
          <div className="flex items-center gap-4 text-xs">
            
            {/* Voice activation */}
            <button
              onClick={toggleVoiceService}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                isVoiceActive
                  ? "bg-violet-950 text-white border-[#8b5cf6] animate-pulse"
                  : isDark
                  ? "bg-[#0a0224] text-[#a78bfa] border-[#8b5cf6]/20 hover:text-white"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
              }`}
              title="Acessibilidade com Comando de Voz"
            >
              {isVoiceActive ? (
                <>
                  <Mic size={12} className="text-white animate-spin" />
                  VOZ ATIVADA
                </>
              ) : (
                <>
                  <MicOff size={12} className="text-slate-400" />
                  MATE-VOZ
                </>
              )}
            </button>

            {/* User Logoff option */}
            <button
              onClick={handleLogout}
              className={`p-1.5 border transition-all cursor-pointer ${
                isDark
                  ? "text-zinc-500 border-zinc-800 hover:text-white hover:bg-zinc-900"
                  : "text-slate-400 border-slate-200 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Sair da Conta / Alterar Telefone"
            >
              <LogOut size={13} />
            </button>

          </div>

        </div>
      </header>

      {/* Voice transcripts toast feedback */}
      {isVoiceActive && voiceTranscript && (
        <div className="bg-violet-900/90 border-b border-[#8b5cf6]/20 py-2 px-6 text-center text-[10px] font-mono text-white animate-pulse flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <span>Comando Recebido: "{voiceTranscript}"</span>
        </div>
      )}

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-28 overflow-hidden">
        
        {/* Error Notification header strip */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 text-red-100 rounded-none text-xs font-mono flex items-center justify-between gap-4">
            <span className="uppercase font-bold">⚠️ Erro: {error}</span>
            <button
              onClick={fetchCrisisState}
              className="px-3 py-1 bg-red-900/30 hover:bg-red-900/60 border border-red-600 text-white text-[10px] font-bold uppercase transition-all"
            >
              Recarregar
            </button>
          </div>
        )}

        {/* Dynamic active screen rendering paired with Framer Motion layout transitions */}
        {crisisState && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              {activeTab === "dashboard" ? (
                <DashboardView
                  crisisState={crisisState}
                  refreshState={fetchCrisisState}
                  onUpdateIncident={handleUpdateIncident}
                  selectedNeighborhood={selectedNeighborhood}
                  onSelectNeighborhood={setSelectedNeighborhood}
                  theme={theme}
                />
              ) : activeTab === "portal" ? (
                <PortalView
                  crisisState={crisisState}
                  refreshState={fetchCrisisState}
                  onSubmitIncident={handleSubmitIncident}
                  userPhone={phoneNumber}
                  theme={theme}
                />
              ) : (
                <SettingsView
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  isVoiceActive={isVoiceActive}
                  onToggleVoice={toggleVoiceService}
                  userPhone={phoneNumber}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Modern Floating Bottom Selector Tabs Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
        <div
          className={`flex items-center gap-2.5 p-1.5 rounded-full border backdrop-blur-md shadow-2xl pointer-events-auto transition-all duration-300 select-none ${
            isDark
              ? "bg-[#0c0d12]/90 border-zinc-800/90 text-slate-100 shadow-violet-950/20"
              : "bg-white/90 border-slate-200/90 text-slate-850 shadow-slate-300/40"
          }`}
        >
          {/* Portal Button - symbol-driven */}
          <button
            onClick={() => {
              setActiveTab("portal");
              setSelectedNeighborhood(null);
            }}
            className={`flex items-center gap-2 py-2 px-4.5 rounded-full transition-all font-sans relative cursor-pointer group ${
              activeTab === "portal"
                ? isDark
                  ? "bg-violet-900/30 text-[#a78bfa] border border-[#a78bfa]/35"
                  : "bg-indigo-50 text-[#231263] border border-indigo-200 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Portal do Cidadão"
          >
            <HeartHandshake size={18} className="transition-transform duration-350 group-hover:scale-110" />
            <span className={`text-[9.5px] font-bold font-mono tracking-wider transition-all duration-300 ${
              activeTab === "portal" ? "opacity-100 max-w-[120px] ml-0.5" : "opacity-40 max-w-0 overflow-hidden hidden group-hover:block"
            }`}>
              CIDADÃO
            </span>
          </button>

          {/* Gabinete Button - symbol-driven */}
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedNeighborhood(null);
            }}
            className={`flex items-center gap-2 py-2 px-4.5 rounded-full transition-all font-sans relative cursor-pointer group ${
              activeTab === "dashboard"
                ? isDark
                  ? "bg-violet-900/30 text-[#a78bfa] border border-[#a78bfa]/35"
                  : "bg-indigo-50 text-[#231263] border border-indigo-200 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Gabinete de Crise"
          >
            <Activity size={18} className="transition-transform duration-350 group-hover:scale-110" />
            <span className={`text-[9.5px] font-bold font-mono tracking-wider transition-all duration-300 ${
              activeTab === "dashboard" ? "opacity-100 max-w-[120px] ml-0.5" : "opacity-40 max-w-0 overflow-hidden hidden group-hover:block"
            }`}>
               GABINETE
            </span>
          </button>

          {/* Configurações Button - symbol-driven */}
          <button
            onClick={() => {
              setActiveTab("configuracoes");
              setSelectedNeighborhood(null);
            }}
            className={`flex items-center gap-2 py-2 px-4.5 rounded-full transition-all font-sans relative cursor-pointer group ${
              activeTab === "configuracoes"
                ? isDark
                  ? "bg-violet-900/30 text-[#a78bfa] border border-[#a78bfa]/35"
                  : "bg-indigo-50 text-[#231263] border border-indigo-200 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Configurações"
          >
            <Settings size={18} className="transition-transform duration-350 group-hover:scale-110" />
            <span className={`text-[9.5px] font-bold font-mono tracking-wider transition-all duration-300 ${
              activeTab === "configuracoes" ? "opacity-100 max-w-[120px] ml-0.5" : "opacity-40 max-w-0 overflow-hidden hidden group-hover:block"
            }`}>
              OPÇÕES
            </span>
          </button>
        </div>
      </div>

      {/* Humanized Civil footer */}
      <footer
        className={`h-14 border-t flex items-center justify-between px-6 font-mono text-[9px] pb-10 sm:pb-0 transition-colors duration-300 ${
          isDark 
            ? "border-zinc-900 bg-[#0d0e15] text-[#a78bfa]/40" 
            : "border-slate-200/80 bg-white text-slate-400"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div>
            Prefeitura do Recife — Gestão de Riscos e Desastres • Defesa Civil PCR
          </div>
          <div className="flex items-center gap-2">
            <span>Hora Oficial: {liveTime}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
