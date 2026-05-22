import React, { useState, useEffect } from "react";
import { CrisisState } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertOctagon,
  Phone,
  LifeBuoy,
  PlusCircle,
  Wifi,
  CloudOff,
  Sparkles,
  ShieldAlert,
  Navigation,
  Globe,
  Radio,
  FileCheck,
  Bell,
  Coins,
  Award,
  Camera,
  Check,
  Gift,
  X,
  ShieldCheck,
  Siren,
  PenLine,
  MessageCircle,
  HelpCircle
} from "lucide-react";

interface PortalViewProps {
  crisisState: CrisisState;
  refreshState: () => void;
  onSubmitIncident: (formData: any) => Promise<void>;
  userPhone: string;
  theme?: "light" | "dark";
}

// Dummy/Mock data for News verification
const fakeNewsDb = [
  {
    id: 1,
    rumor: "Boato nos grupos de WhatsApp de que a barragem de Apipucos rompeu há 20 minutos e a Zona Norte vai alagar completamente.",
    fact: "FALTO. A Defesa Civil e a APAC realizaram vistoria presencial há pouco. A barragem está operando sob controle, dentro da sua calha amortecedora normal de escoamento. Não há risco de colapso.",
    status: "fake"
  },
  {
    id: 2,
    rumor: "Vídeo antigo de alagamento absurdo na Avenida Caxangá em 2011 está circulando como se fosse de hoje de manhã.",
    fact: "EXAGERADO. A Avenida Caxangá possui acúmulo temporário de poças nas calhas laterais, mas o trânsito flui normalmente no corredor principal do BRT. As imagens compartilhadas pertencem à enchente histórica de anos passados.",
    status: "context"
  },
  {
    id: 3,
    rumor: "Avenida Sul está intransitável debaixo do pontilhão da linha férrea por acúmulo de água.",
    fact: "REALIDADE. Ponto crítico de bacia pluvial. Evite a passagem sob o viaduto. Nossas viaturas da CTTU já bloquearam o cruzamento lateral preventivamente.",
    status: "true"
  }
];

export default function PortalView({
  crisisState,
  refreshState,
  onSubmitIncident,
  userPhone,
  theme = "light"
}: PortalViewProps) {
  const isDark = theme === "dark";

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<"inicio" | "relatar" | "conversar" | "fato_boato">("inicio");
  
  // Citizen profile & dashboard configuration (Moeda Capiba and push alert subscription)
  const [registeredNeighborhood, setRegisteredNeighborhood] = useState<string>(() => {
    return localStorage.getItem("recife_resident_neighborhood") || "Imbiribeira";
  });
  const [capibaBalance, setCapibaBalance] = useState<number>(() => {
    const saved = localStorage.getItem("recife_capiba_balance");
    return saved ? parseInt(saved, 10) : 120;
  });
  const [capibaHistory, setCapibaHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("recife_capiba_history");
    if (saved) {
      try { return JSON.parse(saved); } catch(_) {}
    }
    return [
      { id: 1, date: "Ontem", description: "Bônus de Cadastro Cidadão Conectado", amount: 50 },
      { id: 2, date: "Ontem", description: "Vistoria preventiva concluída no quintal", amount: 30 },
      { id: 3, date: "Hoje", description: "Participação no treinamento de evacuação", amount: 40 }
    ];
  });
  const [showCapibaShop, setShowCapibaShop] = useState<boolean>(false);

  // Push Alert Monitoring State
  const [knownIncidentIds, setKnownIncidentIds] = useState<string[]>(() => {
    return crisisState.incidents.map(inc => inc.id);
  });
  const [activePushNotification, setActivePushNotification] = useState<any | null>(null);

  // Form Media & Verification states
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [imageVerifying, setImageVerifying] = useState<boolean>(false);
  const [imageVerificationResult, setImageVerificationResult] = useState<any | null>(null);

  // Monitor incoming server-side incidents for Extreme Risc / severity "critico" push notifications 
  useEffect(() => {
    if (!crisisState.incidents || crisisState.incidents.length === 0) return;

    // Filter out incidents that are in local "known" list
    const newIncidents = crisisState.incidents.filter(
      (inc) => !knownIncidentIds.includes(inc.id)
    );

    if (newIncidents.length > 0) {
      // Find one in user's registered neighborhood with extreme severity ("critico" or "alto")
      const matches = newIncidents.find(
        (inc) =>
          inc.neighborhood.toLowerCase() === registeredNeighborhood.toLowerCase() &&
          (inc.severity === "critico" || inc.severity === "alto")
      );

      if (matches) {
        // Trigger simulated push notification
        setActivePushNotification(matches);
        
        // Push Alert Sound effect fallback
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.15); // A4
          
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.4);
        } catch (e) {
          console.log("Audio notification played visually only.", e);
        }

        // Voice read warning
        if ("speechSynthesis" in window) {
          const warningSpeech = new SpeechSynthesisUtterance(
            `ALERTA URBANO MUNICIPAL EXTERNO: Novo risco extremo de ${matches.category} registrado no seu bairro ${matches.neighborhood}. Fique vigilante!`
          );
          warningSpeech.lang = "pt-BR";
          window.speechSynthesis.speak(warningSpeech);
        }
      }

      // Update known ids list
      setKnownIncidentIds((prev) => {
        const next = [...prev];
        newIncidents.forEach((inc) => {
          if (!next.includes(inc.id)) next.push(inc.id);
        });
        return next;
      });
    }
  }, [crisisState.incidents, registeredNeighborhood, knownIncidentIds]);

  // Incident submission State
  const [formCategory, setFormCategory] = useState<string>("alagamento");
  const [formNeighborhood, setFormNeighborhood] = useState<string>("Imbiribeira");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>(userPhone);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Cache System for offline occurrences
  const [offlineIncidents, setOfflineIncidents] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Botão SOS Hold-to-activate setup
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [panicActive, setPanicActive] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Chatbot State
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: "model",
      content: `Olá! Sou o Assistente Resiliente da Defesa Civil. Como posso ajudar com sua segurança hoje?\nDigite suas perguntas ou clique em uma das dúvidas frequentes apresentadas embaixo.`
    }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Initialize: Load offline cache and watch geo positions
  useEffect(() => {
    // Sync cache
    const saved = localStorage.getItem("recife_offline_incidents");
    if (saved) {
      try {
        setOfflineIncidents(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    }

    // Try tracking coordinates to report exact emergency lat/lng
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.warn("Geolocalização não concedida pelo usuário:", err);
        }
      );
    }
  }, []);

  // Panic hold-to-activate ticker loop
  useEffect(() => {
    let interval: any;
    if (isHolding) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            setIsHolding(false);
            setPanicActive(true);
            triggerSOSVoiceNotification();
            clearInterval(interval);
            return 100;
          }
          return prev + 3.34; // Mathematically takes exactly 3 seconds to reach 100% (30 increments of 3.34)
        });
      }, 100);
    } else {
      setHoldProgress((prev) => Math.max(0, prev - 15));
    }

    return () => clearInterval(interval);
  }, [isHolding]);

  const triggerSOSVoiceNotification = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        "Alerta de pânico SOS ativado! Localização enviada à defesa civil. Por favor chame no número 0800 081 3400 grátis caso mude de local."
      );
      u.lang = "pt-BR";
      window.speechSynthesis.speak(u);
    }
  };

  const startHolding = () => {
    if (panicActive) return;
    setIsHolding(true);
  };

  const stopHolding = () => {
    setIsHolding(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setReportImage(base64);
        setFormSuccessMessage(null);
        setImageVerificationResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadQuickMockImage = (type: "alagamento" | "deslizamento" | "tree") => {
    let mockImg = "";
    if (type === "alagamento") {
      mockImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%231e293b'/><ellipse cx='150' cy='150' rx='130' ry='40' fill='%230284c7'/><text x='150' y='100' font-family='monospace' font-size='14' font-weight='bold' fill='white' text-anchor='middle'>ALAGAMENTO - SOUL RECIFE</text><text x='150' y='125' font-family='sans-serif' font-size='10' fill='%2338bdf8' text-anchor='middle'>Rua Mascarenhas de Morais alagada</text></svg>";
    } else if (type === "deslizamento") {
      mockImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23451a03'/><path d='M0 200 L120 80 L200 130 L300 30 L300 200 Z' fill='%237c2d12'/><text x='150' y='70' font-family='monospace' font-size='14' font-weight='bold' fill='white' text-anchor='middle'>RISCO DE BARREIRA - IBURA</text></svg>";
    } else {
      mockImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23064e3b'/><rect x='130' y='100' width='40' height='100' fill='%2378350f'/><circle cx='150' cy='100' r='50' fill='%23059669'/><path d='M100 110 L200 150' stroke='%23dc2626' stroke-width='6'/><text x='150' y='40' font-family='monospace' font-size='12' font-weight='bold' fill='white' text-anchor='middle'>ARVORE CAIDA DERBY</text></svg>";
    }
    setReportImage(mockImg);
    setImageVerificationResult(null);
    setFormSuccessMessage(null);
  };

  const handleVerifyImageWithIA = async () => {
    if (!reportImage) return;
    setImageVerifying(true);
    setImageVerificationResult(null);

    try {
      const resp = await fetch("/api/verify-incident-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: reportImage,
          category: formCategory,
          neighborhood: formNeighborhood,
          latitude: userLocation?.lat || -8.0578,
          longitude: userLocation?.lng || -34.8829,
          localTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        })
      });

      if (!resp.ok) {
        throw new Error("Erro na resposta do auditor.");
      }

      const data = await resp.json();
      if (data.analysis) {
        setImageVerificationResult(data.analysis);
        
        // Voice response key findings
        if ("speechSynthesis" in window) {
          const detail = data.analysis.concrete 
            ? `Imagem verificada por inteligência artificial. Concreto com ${data.analysis.confidence} por cento de certeza.`
            : `Alerta de auditoria climática. Imagem suspeita ou incompatível.`;
          const utterance = new SpeechSynthesisUtterance(detail);
          utterance.lang = "pt-BR";
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao comunicar com o validador de imagem do Recife.");
    } finally {
      setImageVerifying(false);
    }
  };

  // Submit Incident Report Handler
  const submitCitizenReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormSuccessMessage(null);

    // Dynamic reward calculation based on IA verification presence
    const hasVerifiedPhoto = imageVerificationResult !== null && imageVerificationResult.concrete;
    const coinsEarned = hasVerifiedPhoto ? 30 : 15;

    const reportPayload = {
      title: formTitle,
      category: formCategory,
      description: formDescription,
      neighborhood: formNeighborhood,
      reporterName: formName || "Anônimo",
      reporterPhone: formPhone,
      latitude: userLocation?.lat || -8.0578 + (Math.random() - 0.5) * 0.02,
      longitude: userLocation?.lng || -34.8829 + (Math.random() - 0.5) * 0.02,
      status: "recebido"
    };

    if (!isOnline) {
      // Save offline queue
      const updatedQueue = [...offlineIncidents, reportPayload];
      setOfflineIncidents(updatedQueue);
      localStorage.setItem("recife_offline_incidents", JSON.stringify(updatedQueue));
      
      setFormSuccessMessage("📌 SINAL GUARDADO OFFLINE! Ele será transmitido à central assim que você ativar a conexão.");
      setFormTitle("");
      setFormDescription("");
      setReportImage(null);
      setImageVerificationResult(null);
      setFormSubmitting(false);

      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance("Ocorrência guardada na fila local sem conexão de rede.");
        u.lang = "pt-BR";
        window.speechSynthesis.speak(u);
      }
      return;
    }

    try {
      await onSubmitIncident(reportPayload);

      // Reward Moeda Capiba
      const nextBal = capibaBalance + coinsEarned;
      setCapibaBalance(nextBal);
      localStorage.setItem("recife_capiba_balance", nextBal.toString());

      const bonusDesc = hasVerifiedPhoto 
        ? `Denúncia de ${formCategory} c/ Foto Verificada por IA`
        : `Denúncia de ${formCategory} s/ anexo verificado`;
      
      const newEntry = {
        id: Date.now(),
        date: "Hoje",
        description: bonusDesc,
        amount: coinsEarned
      };
      
      const nextHistory = [newEntry, ...capibaHistory];
      setCapibaHistory(nextHistory);
      localStorage.setItem("recife_capiba_history", JSON.stringify(nextHistory));

      setFormSuccessMessage(`🎉 CHAMADO ENVIADO! Você ganhou +${coinsEarned} Capibas pela sua cidadania ativa! Total: ℂ$ ${nextBal}.`);
      setFormTitle("");
      setFormDescription("");
      setReportImage(null);
      setImageVerificationResult(null);
      
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(`Ocorrência enviada com sucesso à central municipal do Recife. Você ganhou ${coinsEarned} moedas Capiba de gratificação!`);
        u.lang = "pt-BR";
        window.speechSynthesis.speak(u);
      }
    } catch (err) {
      console.error(err);
      setFormSuccessMessage("❌ Falha crítica ao enviar. Salvando na fila local.");
      const updatedQueue = [...offlineIncidents, reportPayload];
      setOfflineIncidents(updatedQueue);
      localStorage.setItem("recife_offline_incidents", JSON.stringify(updatedQueue));
    } finally {
      setFormSubmitting(false);
    }
  };

  // AI Chat helper markdown clean
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/#+\s+(.*)/g, "$1");
  };

  // Send message to Gemini proxy on express backend
  const sendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    const newMessages = [...chatMessages, { role: "user", content: textToSend }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await response.json();
      if (data.text) {
        setChatMessages([...newMessages, { role: "model", content: data.text }]);
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(cleanMarkdown(data.text).slice(0, 160));
          utterance.lang = "pt-BR";
          window.speechSynthesis.speak(utterance);
        }
      } else {
        setChatMessages([...newMessages, { role: "model", content: "Não foi possível obter resposta automatizada do assistente municipal." }]);
      }
    } catch (e) {
      console.error(e);
      setChatMessages([...newMessages, {
        role: "model",
        content: `Serviço temporariamente indisponível.\nOrientações de Emergência:\n- Chame a Defesa Civil no fone 0800 081 3400 (Chuva Pesada).\n- Evite áreas de barreiras rasteiras ou túneis alagados.`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleOnlineState = () => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    if (nextOnline && offlineIncidents.length > 0) {
      offlineIncidents.forEach(async (inc) => {
        try {
          await onSubmitIncident(inc);
        } catch (err) {
          console.error("Erro de sincronização tardia:", err);
        }
      });
      setOfflineIncidents([]);
      localStorage.removeItem("recife_offline_incidents");
      alert("Sincronização Estabelecida! Alertas pluviais em cache transmitidos.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ⚠️ HIGH-PRIORITY MUNICIPAL RESILIENCE BOARD */}
      <div 
        className={`p-4 border rounded-2xl transition-all duration-300 relative overflow-hidden shadow-xs ${
          isDark 
            ? "bg-[#0c0326]/65 border-[#8b5cf6]/30 text-white shadow-violet-500/5 animate-fade-in" 
            : "bg-indigo-50/50 border-indigo-200 text-slate-800 shadow-sm"
        }`}
      >
        <div className="absolute top-0 right-0 -translate-y-1 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Card 1: Alert Level Indicator */}
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isDark ? "bg-[#31115c]/40 text-red-400" : "bg-red-50 text-red-600"}`}>
              <AlertOctagon size={20} className="text-red-500 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-indigo-300">
                Alerta Defesa Civil
              </div>
              <div className="text-xs font-black uppercase text-red-600 dark:text-red-400 leading-tight">
                ESTADO DE ATENÇÃO (Chuvas Fortes)
              </div>
            </div>
          </div>

          {/* Card 2: Tide Info Check */}
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-x px-0 md:px-4 py-2 md:py-0 border-slate-200 dark:border-zinc-800">
            <div className={`p-3 rounded-xl ${isDark ? "bg-[#11244c]/45 text-cyan-400" : "bg-cyan-50 text-cyan-550"}`}>
              <Navigation size={20} className="text-cyan-500 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-cyan-350">
                Tábua de Marés (Porto)
              </div>
              <div className="text-xs font-black text-slate-700 dark:text-slate-200 leading-tight">
                PROX: 1.8 metros (Crítico) • 19:40h
              </div>
            </div>
          </div>

          {/* Card 3: Quick Dial Emergency Call */}
          <div className="flex items-center justify-between gap-3 border-t md:border-t-0 pt-2 md:pt-0">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDark ? "bg-rose-950/40 text-rose-400" : "bg-rose-50 text-rose-500"}`}>
                <Phone size={20} className="text-rose-500 animate-bounce" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-rose-300">
                  Canal de Emergência Livre
                </div>
                <div className="text-xs font-mono font-black text-rose-600 dark:text-rose-450">
                  LIGUE 199 (Salvamento 24h)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔔 FLOATING EMERGENCY PUSH NOTIFICATION TOAST IN USER'S NEIGHBORHOOD */}
      <AnimatePresence>
        {activePushNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-red-650 to-rose-950 border-2 border-red-500 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 z-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -translate-y-2 opacity-10 pointer-events-none">
              <ShieldAlert size={120} />
            </div>
            
            <div className="flex items-center gap-3.5 z-10 text-left">
              <div className="p-3 bg-red-600 animate-bounce rounded-full text-white shrink-0">
                <Bell size={22} className="animate-pulse" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-red-500/30 border border-white/20 rounded-md text-[8.5px] font-mono font-black tracking-widest uppercase block w-fit mb-1">
                  ALERTA MUNICIPAL CRÍTICO (PUSH)
                </span>
                <h4 className="text-xs font-mono font-black uppercase text-red-100 tracking-wide">
                  {activePushNotification.title}
                </h4>
                <p className="text-[10px] text-red-200 mt-0.5 leading-relaxed font-sans max-w-2xl">
                  Um incidente de <strong>risco extremo</strong> foi registrado há pouco no seu bairro cadastrado: <strong>{activePushNotification.neighborhood}</strong>.
                  Detalhes: {activePushNotification.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 z-10 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  setActiveSubTab("inicio");
                  setActivePushNotification(null);
                }}
                className="px-4 py-2 bg-white text-red-950 hover:bg-red-50 font-mono text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer rounded-full"
              >
                Ver Abrigos
              </button>
              <button
                onClick={() => setActivePushNotification(null)}
                className="p-2 hover:bg-white/10 text-white font-black hover:text-red-200 underline text-[10px] transition-all cursor-pointer rounded-full"
                title="Fechar Alerta"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 CITIZEN PROFILE ROW: MONITORAMENTO GEOGRÁFICO & MOEDA CAPIBA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD A: REGISTRO DE MONITORAMENTO DE BAIRRO (PUSH ALERTS TARGET) */}
        <div 
          className={`p-4 border rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 relative overflow-hidden shadow-xs ${
            isDark 
              ? "bg-[#0b0c15] border-zinc-800 text-slate-100 shadow-zinc-950/20" 
              : "bg-white border-slate-200 text-slate-800 shadow-sm"
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3 text-left">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full animate-ping" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-500 rounded-full" />
              <Bell size={18} className="text-cyan-500" />
            </div>
            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#a78bfa] dark:text-[#a78bfa]/85">
                Alerta de Risco Ativo (Subscrito)
              </div>
              <div className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 font-mono flex items-center gap-1.5 mt-0.5">
                Bairro: {registeredNeighborhood}
              </div>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                Monit. de Risco Extremo: ON • Notificará em tempo real
              </p>
            </div>
          </div>

          <div>
            <select
              value={registeredNeighborhood}
              onChange={(e) => {
                const nextB = e.target.value;
                setRegisteredNeighborhood(nextB);
                localStorage.setItem("recife_resident_neighborhood", nextB);
                // Trigger a pleasant voice info
                if ("speechSynthesis" in window) {
                  const speech = new SpeechSynthesisUtterance(`Bairro reconfigurado para área de monitoramento de risco ${nextB}.`);
                  speech.lang = "pt-BR";
                  window.speechSynthesis.speak(speech);
                }
              }}
              className={`text-[10px] font-mono font-extrabold uppercase py-1 px-2 border rounded-xl bg-transparent focus:ring-1 cursor-pointer transition-all outline-none ${
                isDark 
                  ? "border-[#8b5cf6]/35 text-[#a78bfa] hover:border-[#8b5cf6] focus:ring-[#8b5cf6]/40 dark:bg-[#0c0d12]" 
                  : "border-slate-350 text-indigo-950 hover:border-slate-400 focus:ring-indigo-300"
              }`}
            >
              <option value="Imbiribeira" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Imbiribeira</option>
              <option value="Ibura" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Ibura</option>
              <option value="Dois Unidos" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Dois Unidos</option>
              <option value="Beberibe" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Beberibe</option>
              <option value="Casa Amarela" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Casa Amarela</option>
              <option value="Graças" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Graças</option>
              <option value="Santo Amaro" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Santo Amaro</option>
              <option value="Iputinga" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Iputinga</option>
              <option value="Bairro do Recife" className="dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100">Bairro do Recife</option>
            </select>
          </div>
        </div>

        {/* CARD B: MOEDA CAPIBA RECOMPENSA E EXTRATO */}
        <div 
          className={`p-4 border rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 relative overflow-hidden shadow-xs cursor-pointer select-none ${
            isDark 
              ? "bg-[#0b0c15] border-zinc-800 text-slate-100 shadow-zinc-950/20 hover:border-[#8b5cf6]/35" 
              : "bg-white border-slate-200 text-slate-800 shadow-sm hover:border-indigo-300"
          }`}
          onClick={() => setShowCapibaShop(true)}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3 text-left">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
              <Coins size={18} className="text-amber-500 animate-bounce" />
            </div>
            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#a78bfa] dark:text-[#a78bfa]/85">
                Moeda Capiba (Cidadania Recifense)
              </div>
              <div className="text-base font-black text-amber-550 dark:text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                ℂ$ {capibaBalance} <span className="text-[9px] font-medium text-slate-400">(Capibas)</span>
              </div>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-mono leading-none mt-1">
                Trocar por bilhetes de ônibus, bike Itaú ou cinema!
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCapibaShop(true);
            }}
            className={`py-1.5 px-3 rounded-xl hover:scale-105 font-mono text-[9px] uppercase font-bold transition-all ${
              isDark 
                ? "bg-amber-950/30 text-amber-400 border border-amber-500/25" 
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}
          >
            Trocar 🎁
          </button>
        </div>

      </div>

      {/* 🪙 MOEDA CAPIBA DETAIL LAYOUT & PRIZES STORE PANEL (SHOWN WHEN ACTIVE) */}
      <AnimatePresence>
        {showCapibaShop && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-5 border rounded-2xl relative overflow-hidden transition-all duration-300 text-left ${
              isDark 
                ? "bg-[#070417] border-[#8b5cf6]/25 shadow-xl shadow-black/40" 
                : "bg-slate-50 border-slate-200 shadow-sm"
            }`}
          >
            <div className="absolute top-0 right-0 p-3">
              <button 
                onClick={() => setShowCapibaShop(false)}
                className="p-1 px-2.5 rounded-full hover:bg-red-500/10 hover:text-red-500 text-slate-400 font-black cursor-pointer text-xs"
              >
                ✖ Fechar
              </button>
            </div>

            <div className="flex items-center gap-2 border-b pb-2 mb-4 border-slate-200 dark:border-zinc-800">
              <Award size={15} className="text-amber-500 animate-pulse" />
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-950 dark:text-slate-200">
                Central de Recompensas Capiba — Prefeitura do Recife
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Prize Catalogue */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a78bfa]">
                  🛍️ Resgatar Cupons e Serviços Livres:
                </div>

                <div className="space-y-2">
                  {[
                    { id: "p1", name: "Passe Diário Bike Itaú Recife", cost: 40, desc: "Acesso ilimitado de 24h a bicicletas do Recife" },
                    { id: "p2", name: "Ingresso Inteiro Cinema São Luiz", cost: 60, desc: "Válido p/ qualquer mostra na tradicional cinemateca" },
                    { id: "p3", name: "Passe Individual Único BRT Recife", cost: 30, desc: "Válido nos corredores Norte/Sul ou Leste/Oeste" },
                    { id: "p4", name: "Zona Azul Digital Recife (1 hora)", cost: 25, desc: "Estacionamento rotativo via app oficial da CTTU" },
                    { id: "p5", name: "Voucher R$ 15 na Feirinha de Boa Viagem", cost: 50, desc: "Desconto em artesanato ou culinária típica recifense" }
                  ].map((p) => {
                    const canAfford = capibaBalance >= p.cost;
                    return (
                      <div 
                        key={p.id}
                        className={`p-2.5 border transition-all duration-300 flex items-center justify-between gap-3 text-left ${
                          isDark 
                            ? "bg-zinc-950/70 border-zinc-900" 
                            : "bg-white border-slate-200 shadow-3xs"
                        }`}
                      >
                        <div>
                          <span className={`text-[10.5px] uppercase font-black block leading-tight ${isDark ? "text-slate-200":"text-indigo-950"}`}>{p.name}</span>
                          <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">{p.desc}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              const nextBal = capibaBalance - p.cost;
                              setCapibaBalance(nextBal);
                              localStorage.setItem("recife_capiba_balance", nextBal.toString());
                              
                              const newEntry = {
                                id: Date.now(),
                                date: "Agorinha",
                                description: `Resgate de prêmio: ${p.name}`,
                                amount: -p.cost
                              };
                              const nextHistory = [newEntry, ...capibaHistory];
                              setCapibaHistory(nextHistory);
                              localStorage.setItem("recife_capiba_history", JSON.stringify(nextHistory));

                              // Voice success
                              if ("speechSynthesis" in window) {
                                const s = new SpeechSynthesisUtterance("Resgate efetuado com sucesso! Seus passes foram creditados.");
                                s.lang = "pt-BR";
                                window.speechSynthesis.speak(s);
                              }
                              alert(`Sucesso! Você resgatou "${p.name}" por ℂ$ ${p.cost} Capibas. O QR-Code do benefício foi enviado para seu celular.`);
                            }}
                            className={`px-2.5 py-1.5 font-mono text-[9px] uppercase font-black tracking-wider border rounded-xl cursor-pointer ${
                              canAfford
                                ? isDark 
                                  ? "bg-amber-950/40 text-amber-400 border-amber-500/40 hover:bg-[#8b5cf6]/30 hover:text-white hover:border-[#8b5cf6]" 
                                  : "bg-amber-50 text-amber-805 border-amber-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
                                : "bg-slate-100 dark:bg-zinc-900 border-slate-250 dark:border-zinc-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                            }`}
                          >
                            Cust: {p.cost} ℂ$
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ledger Statement / Extrato */}
              <div className="space-y-3 border-t md:border-t-0 md:border-l pt-3 md:pt-0 pl-0 md:pl-4 border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a78bfa]">
                  📑 Histórico de Ganhos e Utilidades:
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {capibaHistory.map((h) => (
                    <div 
                      key={h.id}
                      className="flex items-center justify-between text-[10px] font-mono border-b pb-1.5 border-dashed border-slate-200 dark:border-zinc-805"
                    >
                      <div>
                        <span className="text-slate-400 font-mono text-[8.5px] mr-1">({h.date})</span>
                        <span className={`font-medium ${isDark ? "text-slate-300":"text-slate-705"}`}>{h.description}</span>
                      </div>
                      <span className={`font-black uppercase tracking-wider mr-1 ${h.amount > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {h.amount > 0 ? `+${h.amount}` : h.amount} ℂ$
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`p-3 border rounded-xl text-[9px] leading-relaxed font-mono ${isDark ? "bg-[#0b0c15] border-zinc-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}>
                  💡 <strong>Como ganhar mais Capibas?</strong>
                  <div className="mt-1 space-y-0.5 text-[8.5px]">
                    <div>• Ocorrência sem fotos válidas: +15 Capibas</div>
                    <div>• Reportar com foto auditada e confirmada por IA: <strong>+30 Capibas</strong></div>
                    <div>• Colaboração em alertas climáticos: +10 Capibas</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Portal Sub-tabs Navbar Switcher */}
      <div 
        className={`flex p-2 rounded-full border font-mono text-xs overflow-x-auto gap-2 items-center justify-between w-full transition-all duration-305 ${
          isDark 
            ? "bg-[#0b0c14]/90 border-zinc-800 shadow-lg shadow-black/30" 
            : "bg-slate-100/80 border-slate-200 shadow-xs"
        }`}
      >
        <button
          onClick={() => setActiveSubTab("inicio")}
          className={`flex items-center justify-center gap-2.5 py-2 px-4 transition-all duration-300 font-bold uppercase cursor-pointer rounded-full ${
            activeSubTab === "inicio"
              ? isDark
                ? "bg-violet-900/30 text-[#a78bfa] border border-[#a78bfa]/35 flex-1 min-w-[110px]"
                : "bg-indigo-50 text-[#231263] border border-indigo-200 shadow-xs flex-1 min-w-[110px]"
              : isDark
              ? "text-slate-400 hover:text-white bg-zinc-950/40 w-11 h-11 shrink-0 rounded-full hover:bg-[#231263]/30"
              : "text-slate-500 hover:text-slate-800 bg-white w-11 h-11 shrink-0 rounded-full border border-slate-200 hover:bg-slate-50"
          }`}
          title="Início / SOS"
        >
          <Siren size={15} className={`shrink-0 ${activeSubTab === "inicio" ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
          <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 truncate ${
            activeSubTab === "inicio" ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0 hidden"
          }`}>
            Início / SOS
          </span>
         </button>

         <button
          onClick={() => setActiveSubTab("relatar")}
          className={`flex items-center justify-center gap-2.5 py-2 px-4 transition-all duration-300 font-bold uppercase cursor-pointer rounded-full ${
            activeSubTab === "relatar"
              ? isDark
                ? "bg-violet-900/30 text-[#a78bfa] border border-[#a78bfa]/35 flex-1 min-w-[110px]"
                : "bg-indigo-50 text-[#231263] border border-indigo-200 shadow-xs flex-1 min-w-[110px]"
              : isDark
              ? "text-slate-400 hover:text-white bg-zinc-950/40 w-11 h-11 shrink-0 rounded-full hover:bg-[#231263]/30"
              : "text-slate-500 hover:text-slate-800 bg-white w-11 h-11 shrink-0 rounded-full border border-slate-200 hover:bg-slate-50"
          }`}
          title="Reportar Incidente"
        >
          <PenLine size={15} className={`shrink-0 ${activeSubTab === "relatar" ? "text-[#a78bfa]" : "text-slate-400"}`} />
          <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 truncate ${
            activeSubTab === "relatar" ? "opacity-100 max-w-[130px]" : "opacity-0 max-w-0 hidden"
          }`}>
            Relatar
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("conversar")}
          className={`flex items-center justify-center gap-2.5 py-2 px-4 transition-all duration-300 font-bold uppercase cursor-pointer rounded-full ${
            activeSubTab === "conversar"
              ? isDark
                ? "bg-violet-900/30 text-[#a78bfa] border border-[#a78bfa]/35 flex-1 min-w-[110px]"
                : "bg-indigo-50 text-[#231263] border border-indigo-200 shadow-xs flex-1 min-w-[110px]"
              : isDark
              ? "text-slate-400 hover:text-white bg-zinc-950/40 w-11 h-11 shrink-0 rounded-full hover:bg-[#231263]/30"
              : "text-slate-500 hover:text-slate-800 bg-white w-11 h-11 shrink-0 rounded-full border border-slate-200 hover:bg-slate-50"
          }`}
          title="Chatbot Inteligente"
        >
          <MessageCircle size={15} className={`shrink-0 ${activeSubTab === "conversar" ? "text-cyan-400" : "text-slate-400"}`} />
          <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 truncate ${
            activeSubTab === "conversar" ? "opacity-100 max-w-[130px]" : "opacity-0 max-w-0 hidden"
          }`}>
            Conversar
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("fato_boato")}
          className={`flex items-center justify-center gap-2.5 py-2 px-4 transition-all duration-300 font-bold uppercase cursor-pointer rounded-full ${
            activeSubTab === "fato_boato"
              ? isDark
                ? "bg-violet-900/30 text-[#a78bfa] border border-[#a78bfa]/35 flex-1 min-w-[110px]"
                : "bg-indigo-50 text-[#231263] border border-indigo-200 shadow-xs flex-1 min-w-[110px]"
              : isDark
              ? "text-slate-400 hover:text-white bg-zinc-950/40 w-11 h-11 shrink-0 rounded-full hover:bg-[#231263]/30"
              : "text-slate-500 hover:text-slate-800 bg-white w-11 h-11 shrink-0 rounded-full border border-slate-200 hover:bg-slate-50"
          }`}
          title="Fato ou Boato"
        >
          <HelpCircle size={15} className={`shrink-0 ${activeSubTab === "fato_boato" ? "text-amber-400" : "text-slate-400"}`} />
          <span className={`text-[10px] font-mono tracking-wider transition-all duration-300 truncate ${
            activeSubTab === "fato_boato" ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0 hidden"
          }`}>
            Fato/Boato
          </span>
        </button>
      </div>

      {/* 2. Client cache status line */}
      <div 
        className={`flex items-center justify-between px-3.5 py-2 border rounded-xl text-[10px] font-mono transition-all duration-300 ${
          isDark 
            ? "bg-black/40 border-zinc-900 text-slate-400 shadow-xs" 
            : "bg-slate-50 border-slate-200 text-slate-500 shadow-inner"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Globe size={11} className={isOnline ? "text-cyan-400 animate-pulse" : "text-slate-400"} />
          <span>Fila: <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{offlineIncidents.length} salvos em cache</strong></span>
        </div>
        
        <button
          onClick={toggleOnlineState}
          className={`flex items-center gap-1 py-1 px-3 font-mono font-bold text-[9px] cursor-pointer transition-colors ${
            isOnline
              ? isDark 
                ? "bg-[#0b0222] text-teal-400 border border-teal-500/25" 
                : "bg-teal-50 border border-teal-200 text-teal-700"
              : "bg-red-950 text-red-400 border border-red-500/35"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi size={10} /> CONECTADO
            </>
          ) : (
            <>
              <CloudOff size={10} className="animate-bounce" /> MODO CACHE ATIVO
            </>
          )}
        </button>
      </div>

      {/* 3. Main Content Container using Framer Motion animations inside sub-tabs */}
      <div 
        className={`p-6 border min-h-[420px] rounded-2xl transition-all duration-300 ${
          isDark 
            ? "bg-[#0c0d12] border-zinc-800/80 text-white shadow-xl" 
            : "bg-white border-slate-200 text-slate-800 shadow-xs"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            
            {/* SUBTAB 1: INÍCIO / SOS */}
            {activeSubTab === "inicio" && (
              <div className="space-y-6">
                
                {/* Hold to Activate Distress SOS Card */}
                <div 
                  className={`border p-6 text-center space-y-4 relative overflow-hidden transition-all duration-300 ${
                    isDark 
                      ? "bg-gradient-to-br from-[#0c022e] to-[#040012] border-[#8b5cf6]/35" 
                      : "bg-[#f5f3ff] border-[#8b5cf6]/20"
                  }`}
                >
                  <AlertOctagon className="mx-auto text-red-500 animate-pulse" size={28} />
                  
                  <div>
                    <h3 className="text-sm font-extrabold tracking-wide uppercase">
                      Acionador de Pânico SOS Defesa Civil
                    </h3>
                    <p className={`text-[11px] max-w-lg mx-auto leading-relaxed mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      Mantenha o botão abaixo pressionado caso sinta perigo grave em sua barreira ou moradia para enviar coordenadas imediatas de salvamento.
                    </p>
                  </div>

                  {panicActive ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-black/60 border border-red-500 max-w-sm mx-auto p-4 text-left space-y-3"
                    >
                      <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold animate-pulse">
                        <Radio size={12} className="animate-spin" fill="currentColor" />
                        SINAL SOS ENVIADO PREVENTIVAMENTE!
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono space-y-1">
                        <div>Suas Coordenadas GPS estimadas:</div>
                        <div className="text-cyan-400 px-2 py-1 bg-zinc-900 border border-zinc-800 text-center">
                          Lat: {userLocation?.lat?.toFixed(5) || "-8.05782"} | Long: {userLocation?.lng?.toFixed(5) || "-34.88291"}
                        </div>
                        <div className="text-slate-400 text-[9px] leading-relaxed pt-2">
                          As viaturas foram notificadas preventivamente. Se viável, ligue no suporte telefônico:
                        </div>
                      </div>
                      <a
                        href="tel:08000813400"
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-950 hover:bg-red-900 border border-red-500 text-white text-[11px] font-mono font-bold uppercase transition-colors"
                      >
                        <Phone size={12} /> Ligar: 0800 081 3400
                      </a>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 select-none">
                      <button
                        onMouseDown={startHolding}
                        onMouseUp={stopHolding}
                        onMouseLeave={stopHolding}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          startHolding();
                        }}
                        onTouchEnd={stopHolding}
                        className="relative overflow-hidden w-full max-w-sm h-14 bg-red-700/10 hover:bg-red-700/20 border-2 border-red-600/60 hover:border-red-500 text-white font-black uppercase text-xs tracking-wider rounded-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        style={{ touchAction: "none" }}
                      >
                        {/* Fill Progress bar */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-red-600/70 transition-all duration-75"
                          style={{ width: `${holdProgress}%` }}
                        />
                        
                        <span className="relative z-10 flex items-center gap-1.5 text-red-500 dark:text-white font-mono font-bold">
                          <LifeBuoy size={14} className={isHolding ? "animate-spin text-white" : "animate-bounce"} />
                          {isHolding ? `SEGURE ${Math.max(0, 3 - (holdProgress/100)*3).toFixed(1)}s` : "PRESSIONE E SEGURE 3 SEGUNDOS"}
                        </span>
                      </button>

                      <p className="text-[9px] text-slate-500 uppercase font-mono">
                        Hold-to-activate: Sistema preventivo contra toques involuntários e redundâncias na Defesa Civil.
                      </p>
                    </div>
                  )}
                </div>

                {/* Gov Shelters block */}
                <div className="space-y-3.5">
                  <div className="border-b pb-2 border-slate-200 dark:border-zinc-800">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation size={12} className="text-[#a78bfa]" />
                      Abrigos Governamentais Ativos
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pontos de acolhimento e suporte médico equipados pela PCR em bairros propensos.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {crisisState.shelters.map((she) => {
                      const occPct = Math.round((she.currentOccupants / she.capacity) * 100);
                      return (
                        <div 
                          key={she.id} 
                          className={`p-3.5 border transition-all duration-300 ${
                            isDark 
                              ? "bg-zinc-950/40 border-zinc-800/80" 
                              : "bg-slate-50/50 border-slate-200/80 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`font-bold text-xs uppercase ${isDark ? "text-slate-100":"text-slate-700"}`}>{she.name}</span>
                            <span className="font-mono text-[9px] text-indigo-500 dark:text-sky-400 font-bold uppercase">
                              {she.capacity - she.currentOccupants} vagas livres
                            </span>
                          </div>
                          
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
                            <div>Bairro: {she.neighborhood}</div>
                            <div>Lotação: {she.currentOccupants} acolhidos ({occPct}%)</div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500">Contato: {she.phone}</div>
                          </div>

                          <div className="w-full bg-slate-200 dark:bg-zinc-900 h-1 mt-2.5 overflow-hidden">
                            <div 
                              className={`h-full ${occPct > 85 ? "bg-red-500" : occPct > 65 ? "bg-amber-400" : "bg-[#8b5cf6]"}`} 
                              style={{ width: `${occPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* SUBTAB 2: REPORT NEW INCIDENT FORM */}
            {activeSubTab === "relatar" && (
              <div className="space-y-4 max-w-xl mx-auto py-2 text-left">
                <div className="border-b pb-2 border-slate-200 dark:border-zinc-800">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
                    <PlusCircle size={14} className="text-[#a78bfa]" />
                    Ficha de Chamado Pluvial com Auditoria por IA
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Reporte incidentes em tempo real com anexo fotográfico auditado para ganhar recompensas Capiba maiores.</p>
                </div>

                {formSuccessMessage && (
                  <div className="p-3 bg-slate-100 dark:bg-[#0a0222] border border-indigo-400 dark:border-[#8b5cf6]/35 text-indigo-800 dark:text-slate-100 text-[10px] font-mono font-semibold uppercase text-center rounded-xl tracking-wide">
                    {formSuccessMessage}
                  </div>
                )}

                {/* Simulated Templates for quick testing */}
                <div className="p-3 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <div className="text-[9px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">
                    ⚡ Teste Rápido: Selecione uma Imagem Realista Simulada de Recife
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory("alagamento");
                        setFormNeighborhood("Imbiribeira");
                        loadQuickMockImage("alagamento");
                      }}
                      className="p-1.5 flex flex-col items-center justify-center border text-center hover:scale-[1.02] cursor-pointer transition-all bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/60"
                    >
                      <span className="text-sm">💧</span>
                      <span className="text-[8px] font-mono font-black uppercase text-sky-700 dark:text-sky-400 mt-1">Alagamento</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory("deslizamento");
                        setFormNeighborhood("Ibura");
                        loadQuickMockImage("deslizamento");
                      }}
                      className="p-1.5 flex flex-col items-center justify-center border text-center hover:scale-[1.02] cursor-pointer transition-all bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                    >
                      <span className="text-sm">⛰️</span>
                      <span className="text-[8px] font-mono font-black uppercase text-amber-700 dark:text-amber-400 mt-1">Deslizamento</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory("arvore_caida");
                        setFormNeighborhood("Graças");
                        loadQuickMockImage("tree");
                      }}
                      className="p-1.5 flex flex-col items-center justify-center border text-center hover:scale-[1.02] cursor-pointer transition-all bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                    >
                      <span className="text-sm">🌳</span>
                      <span className="text-[8px] font-mono font-black uppercase text-emerald-700 dark:text-emerald-400 mt-1">Árvore Caída</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={submitCitizenReport} className="space-y-3.5 pt-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Categoria de Risco</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className={`w-full text-xs border rounded-xl p-2.5 font-mono outline-none focus:ring-1 focus:ring-indigo-300 ${
                          isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="alagamento">Alagamento de rua ou via urbana</option>
                        <option value="deslizamento">Deslizamento de terra ou talude</option>
                        <option value="arvore_caida">Árvore desabada ou fiação rompida</option>
                        <option value="bueiro_entupido">Bueiro entupido / Refluxo de esgoto</option>
                        <option value="outros">Outras anomalias geológicas / Drenagem</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Bairro do Ocorrido</label>
                      <select
                        value={formNeighborhood}
                        onChange={(e) => setFormNeighborhood(e.target.value)}
                        className={`w-full text-xs border rounded-xl p-2.5 font-mono outline-none focus:ring-1 focus:ring-indigo-300 ${
                          isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="Ibura">Ibura</option>
                        <option value="Dois Unidos">Dois Unidos</option>
                        <option value="Bairro do Recife">Bairro do Recife</option>
                        <option value="Beberibe">Beberibe</option>
                        <option value="Casa Amarela">Casa Amarela</option>
                        <option value="Graças">Graças</option>
                        <option value="Imbiribeira">Imbiribeira</option>
                        <option value="Santo Amaro">Santo Amaro</option>
                        <option value="Iputinga">Iputinga</option>
                      </select>
                    </div>
                  </div>

                  {/* 📷 ADVANCED PHOTO ATTACHMENT BOX & IA METADATA VALIDATOR */}
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-mono block">
                      Evidência por Foto (Anexar ou Capturar) 
                      <span className="text-amber-500 font-bold ml-1">• Vale 30 Capibas!</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Image Preview / Capture Trigger */}
                      <div 
                        className={`border-2 border-dashed p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-all min-h-[140px] ${
                          reportImage 
                            ? "bg-slate-100/50 dark:bg-black/35 border-indigo-400" 
                            : isDark ? "bg-black/20 border-zinc-805 hover:bg-black/40" : "bg-slate-50 border-slate-250 hover:bg-slate-100"
                        }`}
                      >
                        {reportImage ? (
                          <div className="w-full relative">
                            <img 
                              src={reportImage} 
                              alt="Anexo do Cidadão" 
                              className="max-h-[120px] mx-auto object-contain rounded-lg border border-slate-200 dark:border-zinc-800"
                            />
                            <div className="absolute -top-1 -right-1 flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setReportImage(null);
                                  setImageVerificationResult(null);
                                }}
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full cursor-pointer text-xs shadow-md"
                                title="Remover Foto"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Camera size={24} className="mx-auto text-[#8b5cf6]/60 dark:text-[#a78bfa]/60" />
                            <div className="text-[10px] text-slate-400">Tire uma foto local ou selecione arquivo do dispositivo</div>
                            
                            <label 
                              htmlFor="report_image_input"
                              className="inline-block py-1 px-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[9px] font-mono uppercase font-black tracking-wide rounded-xl cursor-pointer transition-colors"
                            >
                              Carregar Foto
                            </label>
                            <input 
                              type="file" 
                              accept="image/*" 
                              id="report_image_input" 
                              className="hidden" 
                              onChange={handleImageFileChange}
                            />
                          </div>
                        )}
                      </div>

                      {/* IA Geoverification Panel */}
                      <div 
                        className={`p-3.5 border rounded-xl flex flex-col justify-center text-left ${
                          isDark ? "bg-zinc-950/40 border-zinc-900" : "bg-slate-50/70 border-slate-200"
                        }`}
                      >
                        {!reportImage ? (
                          <div className="text-center p-4">
                            <ShieldCheck size={20} className="mx-auto text-slate-400 dark:text-zinc-700 mb-1" />
                            <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 leading-normal">
                              Anexe uma imagem para ativar a validação do coletivo e geolocalização por IA contra Fake News.
                            </p>
                          </div>
                        ) : imageVerifying ? (
                          <div className="text-center p-4 space-y-2">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-[9px] font-mono text-[#a78bfa] uppercase font-bold tracking-widest animate-pulse">
                              Analisando Metadados GPS, Hora e Clima...
                            </p>
                          </div>
                        ) : imageVerificationResult ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b pb-1 border-slate-200 dark:border-zinc-800">
                              <span className="text-[8px] font-mono font-bold uppercase text-slate-400">Resultado Auditoria IA</span>
                              {imageVerificationResult.concrete ? (
                                <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/55 border border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-[8px] font-mono font-extrabold uppercase rounded-lg">
                                  🛡️ Imagem Concreta
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/55 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-[8px] font-mono font-extrabold uppercase rounded-lg">
                                  ⚠️ Incompatível / Falsa
                                </span>
                              )}
                            </div>

                            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-normal">
                              {imageVerificationResult.justification}
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono border-t pt-1.5 border-dashed border-slate-200 dark:border-zinc-800">
                              <div>Confiança: <strong className="text-indigo-400">{imageVerificationResult.confidence}%</strong></div>
                              <div>Risco: <strong className="text-amber-500">{imageVerificationResult.concernLevel?.toUpperCase()}</strong></div>
                            </div>

                            {imageVerificationResult.suggestedTitle && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormTitle(imageVerificationResult.suggestedTitle);
                                  // Pleasant sound accent
                                  if ("speechSynthesis" in window) {
                                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Título sugerido aplicado!"));
                                  }
                                }}
                                className="w-full text-center py-1 mt-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-[#a78bfa] border border-indigo-400/20 font-mono text-[8px] uppercase font-bold rounded-lg cursor-pointer"
                              >
                                ✍️ Aplicar Título: "{imageVerificationResult.suggestedTitle}"
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-center p-2.5">
                            <p className="text-[9.5px] font-mono text-slate-500 dark:text-slate-400 leading-tight mb-2.5">
                              Foto anexada! Audite com nossa inteligência geográfica municipal para confirmar conformidade climatológica.
                            </p>
                            <button
                              type="button"
                              onClick={handleVerifyImageWithIA}
                              className="py-1.5 px-3 block mx-auto bg-amber-500 hover:bg-amber-600 text-white font-mono text-[9px] uppercase font-bold tracking-wider rounded-xl cursor-pointer transition-colors"
                            >
                              Auditar Foto com IA 🧠
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Título do Chamado</label>
                    <input
                      type="text"
                      className={`w-full text-xs border rounded-xl p-2.5 font-mono outline-none focus:ring-1 focus:ring-indigo-300 ${
                        isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                      placeholder="Ex: Barreira deslizando na parte de trás da casa"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Detalhes Adicionais e Pontos de Referência</label>
                    <textarea
                      rows={3}
                      className={`w-full text-xs border rounded-xl p-2.5 font-mono outline-none resize-none focus:ring-1 focus:ring-indigo-300 ${
                        isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                      placeholder="Ex: Próximo ao mercadinho. Há residência com crianças próximas à encosta."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[9px] text-slate-505 uppercase font-mono block mb-1">Seu Nome</label>
                      <input
                        type="text"
                        className={`w-full text-xs border rounded-xl p-2.5 font-mono outline-none ${
                        isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                        placeholder="Ex: Severino Silva"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Celular Cadastrado (Salvo)</label>
                      <input
                        type="tel"
                        disabled
                        className="w-full text-xs border rounded-xl p-2.5 font-mono bg-slate-100 dark:bg-zinc-950 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-zinc-900 cursor-not-allowed"
                        value={userPhone}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-3 mt-4 bg-gradient-to-r from-[#17053b] to-[#04010a] hover:from-[#250b5e] hover:to-[#070114] border border-[#8b5cf6]/50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer text-center transition-all"
                  >
                    {formSubmitting ? "ENVIANDO..." : isOnline ? "Transmitir Alerta e Coletar Capibas 🪙" : "Guardar em Cache (Offline)"}
                  </button>
                </form>
              </div>
            )}

            {/* SUBTAB 3: CHATBOT AI */}
            {activeSubTab === "conversar" && (
              <div className="flex flex-col h-[460px]">
                <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-violet-500 animate-pulse" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                      Suporte de Riscos e Climatologia
                    </h4>
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-400">Canal Ativo via Gemini IA</span>
                </div>

                {/* FAQ Presets suggestions */}
                <div className="flex flex-wrap gap-2 my-3">
                  <button
                    onClick={() => sendChatMessage("Quais são os endereços dos abrigos ativos?")}
                    className={`text-[9.5px] font-mono uppercase px-2.5 py-1.5 border transition-all cursor-pointer ${
                      isDark 
                        ? "bg-[#0c022e] hover:bg-[#231263] border-[#8b5cf6]/30 text-sky-400" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 shadow-2xs"
                    }`}
                  >
                    🏥 Endereços de abrigos?
                  </button>
                  <button
                    onClick={() => sendChatMessage("Como agir em caso de risco de deslizamento de terra?")}
                    className={`text-[9.5px] font-mono uppercase px-2.5 py-1.5 border transition-all cursor-pointer ${
                      isDark 
                        ? "bg-[#0c022e] hover:bg-[#231263] border-[#8b5cf6]/30 text-sky-400" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 shadow-2xs"
                    }`}
                  >
                    ▲ Risco em Barreiras
                  </button>
                  <button
                    onClick={() => sendChatMessage("Quais os cuidados de saúde contra leptospirose em áreas alagadas?")}
                    className={`text-[9.5px] font-mono uppercase px-2.5 py-1.5 border transition-all cursor-pointer ${
                      isDark 
                        ? "bg-[#0c022e] hover:bg-[#231263] border-[#8b5cf6]/30 text-sky-400" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 shadow-2xs"
                    }`}
                  >
                    💧 Evitar Leptospirose
                  </button>
                </div>

                {/* Messages Panel area */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scroll-smooth py-1.5">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-none p-3.5 text-xs leading-relaxed border ${
                          msg.role === "user"
                            ? isDark
                              ? "bg-[#0c022e] border-[#8b5cf6]/30 text-white"
                              : "bg-indigo-50 border-indigo-200 text-indigo-950 font-medium"
                            : isDark
                            ? "bg-zinc-950/80 border-zinc-900 text-slate-200"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className="font-mono text-[8.5px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
                          {msg.role === "user" ? "Cidadão (Você)" : "Defesa Civil Digital"}
                        </div>
                        <div className="whitespace-pre-line font-medium leading-relaxed font-sans">{cleanMarkdown(msg.content)}</div>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-50 dark:bg-zinc-950 text-slate-400 rounded-none p-3 text-xs border border-slate-200 dark:border-zinc-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-[#a78bfa] rounded-full animate-ping" />
                        <span className="text-[10px] font-mono">Processando protocolo de segurança...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Textbox form */}
                <div 
                  className={`flex gap-2 p-1.5 border rounded-2xl mt-3.5 transition-all shadow-xs ${
                    isDark ? "bg-black border-zinc-800 focus-within:border-violet-500" : "bg-slate-50 border-slate-200 focus-within:border-indigo-400"
                  }`}
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder="Faça uma pergunta (Ex: Como se cadastrar para alertas SMS?)"
                    className="flex-1 bg-transparent border-none text-xs text-indigo-600 dark:text-cyan-400 font-bold outline-none px-3 font-mono h-9 placeholder-slate-400"
                  />
                  <button
                    onClick={() => sendChatMessage()}
                    className="bg-indigo-900 dark:bg-[#0c022e] hover:bg-[#231263] border border-[#8b5cf6]/60 text-white font-mono text-xs font-bold rounded-xl px-5 py-1.5 transition-all cursor-pointer"
                  >
                    ENVIAR
                  </button>
                </div>
              </div>
            )}

            {/* SUBTAB 4: DETECTOR DE FAKE NEWS */}
            {activeSubTab === "fato_boato" && (
              <div className="space-y-4 max-w-xl mx-auto py-2">
                <div className="border-b pb-2 border-slate-200 dark:border-zinc-800">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
                    <ShieldAlert size={14} className="text-amber-500 animate-pulse" />
                    Verificador Contra Desinformação
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Esclarecimentos oficiais sobre boatos pluviais que circulam em redes e mídias.</p>
                </div>

                <div className="space-y-4 pt-1.5">
                  {fakeNewsDb.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-none relative transition-colors ${
                        isDark ? "bg-zinc-950/60 border-zinc-900" : "bg-slate-50/50 border-slate-250 shadow-2xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 mb-2 border-slate-200 dark:border-zinc-900">
                        <span className="text-[9.5px] font-mono text-slate-400 flex items-center gap-1">
                          <FileCheck size={11} className="text-indigo-400" /> ID: RFC-{item.id}09
                        </span>
                        
                        {item.status === "fake" ? (
                          <span className="px-2.5 py-0.5 text-[9px] font-mono bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 font-bold uppercase tracking-wide">
                            🚨 BOATO FALSO
                          </span>
                        ) : item.status === "context" ? (
                          <span className="px-2.5 py-0.5 text-[9px] font-mono bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-bold uppercase tracking-wide">
                            ⚠️ EXAGERADO
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[9px] font-mono bg-teal-100 dark:bg-[#0c022e] text-teal-700 dark:text-[#a78bfa] border border-teal-200 dark:border-[#8b5cf6]/30 font-bold uppercase tracking-wide">
                            ✅ NOTÍCIA REAL
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 italic mb-3 leading-relaxed">
                        "{item.rumor}"
                      </div>
                      
                      <div className={`text-xs pl-3 py-2 border-l-2 leading-relaxed font-sans ${
                        isDark 
                          ? "bg-slate-950/30 border-[#8b5cf6]/50 text-slate-200" 
                          : "bg-indigo-50/40 border-indigo-400 text-slate-800"
                      }`}>
                        <strong>Apuração da Defesa Civil:</strong> {item.fact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
