import React, { useState } from "react";
import { CrisisState, Incident } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Droplet,
  Users,
  Activity,
  Filter,
  Sparkles,
  RefreshCw,
  TrendingUp,
  MapPin,
  Clock,
  Briefcase,
  CheckSquare
} from "lucide-react";
import RecifeMap from "./RecifeMap";

function cleanMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/#{1,6}\s?/g, "") // Remove ## headers
    .replace(/\*{1,2}/g, "")   // Remove ** and * styles
    .replace(/_{1,2}/g, "")    // Remove __ and _ styles
    .replace(/`{1,3}/g, "")    // Remove ` inline/fenced code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // Remove markdown links but keep text
    .trim();
}

interface DashboardViewProps {
  crisisState: CrisisState;
  refreshState: () => void;
  onUpdateIncident: (id: string, status: string, agency: string) => void;
  selectedNeighborhood: string | null;
  onSelectNeighborhood: (neighborhood: string | null) => void;
  theme?: "light" | "dark";
}

export default function DashboardView({
  crisisState,
  refreshState,
  onUpdateIncident,
  selectedNeighborhood,
  onSelectNeighborhood,
  theme = "light",
}: DashboardViewProps) {
  const isDark = theme === "dark";

  const [activeSubTab, setActiveSubTab] = useState<"ocorrencias" | "mapa" | "monitoramento" | "analise_ia">("ocorrencias");
  const [activeLayer, setActiveLayer] = useState<"all" | "flood" | "slide" | "assets">("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [reportSimulated, setReportSimulated] = useState<boolean>(false);

  // Filtered incidents based on operator selections
  const filteredIncidents = crisisState.incidents.filter((inc) => {
    const matchNeighborhood = selectedNeighborhood ? inc.neighborhood.includes(selectedNeighborhood) : true;
    const matchSeverity = severityFilter === "all" ? true : inc.severity === severityFilter;
    const matchCategory = categoryFilter === "all" ? true : inc.category === categoryFilter;
    const matchStatus = statusFilter === "all" ? true : inc.status === statusFilter;
    return matchNeighborhood && matchSeverity && matchCategory && matchStatus;
  });

  const generateAiReport = async () => {
    setReportLoading(true);
    setAiReport(null);
    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (data.report) {
        setAiReport(data.report);
        setReportSimulated(!!data.simulated);
      } else {
        setAiReport("Falha ao gerar o briefing. Tente novamente em alguns instantes.");
      }
    } catch (e) {
      console.error(e);
      setAiReport("Ocorreu um erro técnico na conexão com o assistente inteligente.");
    } finally {
      setReportLoading(false);
    }
  };

  // KPIs calculations
  const activeIncidents = crisisState.incidents.filter(i => i.status !== "resolvido");
  const criticalIncidentsCount = crisisState.incidents.filter(i => i.severity === "critico" && i.status !== "resolvido").length;
  const criticalSensors = crisisState.sensors.filter(s => s.status === "critico").length;
  const totalShelterCapacity = crisisState.shelters.reduce((acc, current) => acc + current.capacity, 0);
  const totalShelterOccupants = crisisState.shelters.reduce((acc, current) => acc + current.currentOccupants, 0);

  // Motion Variants for Staggered Grid Load
  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
  };

  const kpiItemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Operations Status strip line (Moved to absolute top of view) */}
      <div 
        className={`flex items-center justify-between px-4 py-2.5 border text-[10px] font-mono transition-all duration-300 rounded-2xl ${
          isDark 
            ? "bg-black/30 border-zinc-800 text-slate-400" 
            : "bg-slate-50/80 border-slate-200 text-slate-500 shadow-2xs"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Gabinete de Crise: <strong className={isDark ? "text-slate-200":"text-slate-800"}>Prefeitura do Recife</strong>
        </span>
        <button
          onClick={refreshState}
          className={`flex items-center gap-1.5 px-3 py-1 font-mono font-bold text-[9px] uppercase cursor-pointer transition-all border rounded-xl ${
            isDark 
              ? "bg-[#0b0c24] border-[#8b5cf6]/20 text-slate-200 hover:text-white" 
              : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <RefreshCw size={11} className="text-violet-500 animate-spin" style={{ animationDuration: "14s" }} />
          Sincronizar Dados
        </button>
      </div>

      {/* 2. Minimalistic KPI Bar (Moved to top of view, below status strip) */}
      <motion.div 
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* KPI 1 */}
        <motion.div 
          variants={kpiItemVariants}
          className={`p-4 border border-l-4 transition-all duration-300 ${
            isDark 
              ? "bg-[#0e0f17] border-zinc-900 border-l-violet-500 text-white" 
              : "bg-white border-slate-200 border-l-violet-600 text-slate-800 shadow-xs"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Ocorrências Atendidas</span>
              <span className="text-lg font-mono font-bold mt-1.5 block">
                {activeIncidents.length} <span className="text-[10px] font-sans font-normal text-slate-400">ATIVAS</span>
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0a0224] border-zinc-800 text-slate-300":"bg-slate-50 border-slate-100 text-slate-700"}`}>
              <AlertTriangle size={14} className="text-violet-500" />
            </div>
          </div>
          <div className="mt-2 text-[9.5px] text-slate-500 dark:text-slate-400 font-mono">
            <strong className="text-violet-600 dark:text-[#a78bfa]">{criticalIncidentsCount} em situação crítica</strong>
          </div>
        </motion.div>

        {/* KPI 2 */}
        <motion.div 
          variants={kpiItemVariants}
          className={`p-4 border border-l-4 transition-all duration-300 ${
            isDark 
              ? "bg-[#0e0f17] border-zinc-900 border-l-amber-500 text-white" 
              : "bg-white border-slate-200 border-l-amber-600 text-slate-800 shadow-xs"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Rios Sob Transbordo</span>
              <span className="text-lg font-mono font-bold text-amber-500 dark:text-amber-400 mt-1.5 block">
                {criticalSensors} <span className="text-[10px] font-sans font-normal text-slate-400">CRÍTICOS</span>
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0a0224] border-zinc-800 text-slate-300":"bg-slate-50 border-slate-100 text-slate-700"}`}>
              <Droplet size={14} className="text-amber-500" />
            </div>
          </div>
          <div className="mt-2 text-[9.5px] text-slate-400 font-mono">
            Vigilância ativa: Rio Tejipió e Beberibe
          </div>
        </motion.div>

        {/* KPI 3 */}
        <motion.div 
          variants={kpiItemVariants}
          className={`p-4 border border-l-4 transition-all duration-300 ${
            isDark 
              ? "bg-[#0e0f17] border-zinc-900 border-l-sky-500 text-white" 
              : "bg-white border-slate-200 border-l-sky-600 text-slate-800 shadow-xs"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Lotação de Abrigos</span>
              <span className="text-lg font-mono font-bold text-sky-500 dark:text-sky-450 mt-1.5 block">
                {totalShelterCapacity > 0 ? Math.round((totalShelterOccupants / totalShelterCapacity) * 100) : 0}%
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0a0224] border-zinc-800 text-slate-300":"bg-slate-50 border-slate-100 text-slate-700"}`}>
              <Users size={14} className="text-sky-550" />
            </div>
          </div>
          <div className="mt-2 text-[9.5px] text-slate-400 font-mono">
            {totalShelterOccupants} cidadãos acolhidos
          </div>
        </motion.div>

        {/* KPI 4 */}
        <motion.div 
          variants={kpiItemVariants}
          className={`p-4 border border-l-4 transition-all duration-300 ${
            isDark 
              ? "bg-[#0e0f17] border-zinc-900 border-l-emerald-500 text-white" 
              : "bg-white border-slate-200 border-l-emerald-600 text-slate-800 shadow-xs"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Rede Médica de Apoio</span>
              <span className="text-lg font-mono font-bold text-emerald-500 dark:text-emerald-400 mt-1.5 block">
                {crisisState.hospitals.filter(h => h.status === "emergencia" || h.status === "sobrecarregado").length}
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0a0224] border-zinc-800 text-slate-300":"bg-slate-50 border-slate-100 text-slate-700"}`}>
              <Activity size={14} className="text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 text-[9.5px] text-slate-400 font-mono">
            Anamnese: Prontos Socorros de retaguarda
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Subtab Navbar Switcher (Placed below KPIs) */}
      <div 
        className={`flex p-1.5 rounded-2xl border font-mono text-xs overflow-x-auto gap-2 transition-all duration-300 ${
          isDark 
            ? "bg-[#0b0c14] border-zinc-800" 
            : "bg-slate-100 border-slate-200"
        }`}
      >
        <button
          onClick={() => setActiveSubTab("ocorrencias")}
          className={`flex-1 min-w-[125px] text-center py-2 px-3 transition-all font-bold uppercase cursor-pointer rounded-xl ${
            activeSubTab === "ocorrencias"
              ? isDark
                ? "bg-[#231263] text-white border border-[#8b5cf6]/40 shadow-sm"
                : "bg-white text-[#231263] border border-slate-300 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📝 Ocorrências ({filteredIncidents.length})
        </button>
        <button
          onClick={() => setActiveSubTab("mapa")}
          className={`flex-1 min-w-[125px] text-center py-2 px-3 transition-all font-bold uppercase cursor-pointer rounded-xl ${
            activeSubTab === "mapa"
              ? isDark
                ? "bg-[#231263] text-white border border-[#8b5cf6]/40 shadow-sm"
                : "bg-white text-[#231263] border border-slate-300 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🗺️ Mapa Operativo
        </button>
        <button
          onClick={() => setActiveSubTab("monitoramento")}
          className={`flex-1 min-w-[125px] text-center py-2 px-3 transition-all font-bold uppercase cursor-pointer rounded-xl ${
            activeSubTab === "monitoramento"
              ? isDark
                ? "bg-[#231263] text-white border border-[#8b5cf6]/40 shadow-sm"
                : "bg-white text-[#231263] border border-slate-300 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🌧️ Chuvas e Sensores
        </button>
        <button
          onClick={() => setActiveSubTab("analise_ia")}
          className={`flex-1 min-w-[125px] text-center py-2 px-3 transition-all font-bold uppercase cursor-pointer rounded-xl ${
            activeSubTab === "analise_ia"
              ? isDark
                ? "bg-[#231263] text-white border border-[#8b5cf6]/40 shadow-sm"
                : "bg-white text-[#231263] border border-slate-300 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          ✨ Briefing Inteligente
        </button>
      </div>

      {/* 4. Active Tab content display layer */}
      <div 
        className={`p-6 border min-h-[460px] transition-all duration-300 ${
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
            
            {/* SUBTAB 1: MANAGING ACTIVE INCIDENTS */}
            {activeSubTab === "ocorrencias" && (
              <div className="space-y-5">
                
                {/* Control filters dashboard panel */}
                <div 
                  className={`border p-4 space-y-3.5 transition-colors duration-300 ${
                    isDark ? "bg-[#0b0c15] border-zinc-900" : "bg-slate-50 border-slate-250 shadow-2xs"
                  }`}
                >
                  <div className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 border-slate-200 dark:border-zinc-800/80">
                    <Filter size={13} className="text-violet-500" />
                    Módulo de Classificação e Triagem
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Status Operacional</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`w-full text-xs font-mono p-2 border rounded-none outline-none focus:ring-1 focus:ring-indigo-300 ${
                          isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="all">Ver todas</option>
                        <option value="pendente">Pendentes (Não Atendidas)</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="resolvido">Resolvidas (Concluídas)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Risco Estimado</label>
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className={`w-full text-xs font-mono p-2 border rounded-none outline-none focus:ring-1 focus:ring-indigo-300 ${
                          isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="all">Todos os graus</option>
                        <option value="critico">Gravidade Crítica</option>
                        <option value="alto">Nível Alto</option>
                        <option value="medio">Grau Médio</option>
                        <option value="baixo">Risco Baixo</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Anomalia Pluvial</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className={`w-full text-xs font-mono p-2 border rounded-none outline-none focus:ring-1 focus:ring-indigo-300 ${
                          isDark ? "bg-black border-zinc-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="all">Qualquer Categoria</option>
                        <option value="alagamento">Alagamento Pluvial</option>
                        <option value="deslizamento">Deslizamento Barreira</option>
                        <option value="arvore_caida">Árvore ou Fiação</option>
                        <option value="bueiro_entupido">Bueiro Obstruído</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Listing incidents cards */}
                <motion.div 
                  variants={cardContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filteredIncidents.length === 0 ? (
                    <div className="text-center col-span-2 py-12 text-xs font-mono text-slate-400 border border-dashed border-slate-205">
                      Nenhum alerta correspondente aos filtros de pesquisa ativos.
                    </div>
                  ) : (
                    filteredIncidents.map((inc) => (
                      <motion.div
                        key={inc.id}
                        variants={cardItemVariants}
                        className={`p-4 border rounded-none transition-all duration-300 ${
                          inc.status === "resolvido"
                            ? "opacity-60 border-slate-200 dark:border-zinc-900 bg-slate-50 dark:bg-black/10"
                            : inc.severity === "critico"
                            ? "border-l-4 border-l-red-500 bg-red-500/5 dark:bg-red-500/[0.01]"
                            : "bg-[#0c0d16]/30 dark:bg-zinc-950/40"
                        } ${
                          isDark ? "border-zinc-800 text-slate-100" : "border-slate-200 text-slate-800 shadow-2xs"
                        }`}
                        style={{
                          borderLeftColor: inc.status === "resolvido" 
                            ? undefined 
                            : inc.severity === "critico" 
                            ? "#ef4444" 
                            : inc.severity === "alto" 
                            ? "#f59e0b" 
                            : "#8b5cf6"
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-mono font-bold py-0.5 px-2 uppercase border ${
                            inc.severity === "critico" 
                              ? "text-red-500 border-red-500/20 bg-red-100 dark:bg-red-950/20" 
                              : inc.severity === "alto" 
                              ? "text-amber-500 border-amber-500/25 bg-amber-50 dark:bg-amber-950/20" 
                              : "text-slate-400 border-slate-200 dark:border-zinc-800"
                          }`}>
                            {inc.severity.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(inc.reportingTime).toLocaleTimeString("pt-BR")} BRT
                          </span>
                        </div>

                        <h4 className={`font-bold text-xs font-mono uppercase mb-1.5 ${isDark ? "text-slate-100":"text-slate-800"}`}>
                          {inc.title}
                        </h4>
                        
                        <p className={`text-xs leading-relaxed mb-3.5 ${isDark ? "text-slate-300":"text-slate-600"}`}>
                          {inc.description}
                        </p>

                        <div className={`text-[10px] font-mono space-y-1 py-2 px-3 border border-dashed rounded-none mb-4.5 ${
                          isDark ? "bg-black/30 border-zinc-900 text-zinc-400" : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}>
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-red-400 shrink-0" />
                            <span>Bairro: <strong>{inc.neighborhood.toUpperCase()}</strong></span>
                          </div>
                          <div>👤 Reporter: {inc.citizenName} ({inc.citizenPhone})</div>
                          
                          {inc.agencyAssigned && (
                            <div className="text-violet-600 dark:text-[#a78bfa] block font-bold uppercase mt-1">
                              🛡️ Apoio Despachado: {inc.agencyAssigned}
                            </div>
                          )}
                        </div>

                        {/* Interactive operator state triggers */}
                        {inc.status !== "resolvido" && (
                          <div className="border-t border-slate-150 dark:border-zinc-900 pt-2.5 flex gap-2">
                            {inc.status === "pendente" ? (
                              <button
                                onClick={() => {
                                  const depAgent = inc.category === "deslizamento" ? "Defesa Civil" : inc.category === "alagamento" ? "CTTU" : "EMLURB";
                                  onUpdateIncident(inc.id, "em_atendimento", depAgent);
                                  if ('speechSynthesis' in window) {
                                    window.speechSynthesis.cancel();
                                    const u = new SpeechSynthesisUtterance(`Suporte acionado. Despachando viaturas de ${depAgent} para apoio imediato.`);
                                    u.lang = "pt-BR";
                                    window.speechSynthesis.speak(u);
                                  }
                                }}
                                className="w-full bg-indigo-900 dark:bg-[#0c022e] hover:bg-indigo-850 dark:hover:bg-[#231263] border border-[#8b5cf6]/60 text-white font-mono text-[9px] font-bold py-2 tracking-wider uppercase transition-all rounded-none cursor-pointer"
                              >
                                Despachar Socorro Emergencial
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  onUpdateIncident(inc.id, "resolvido", inc.agencyAssigned || "");
                                  if ('speechSynthesis' in window) {
                                    window.speechSynthesis.cancel();
                                    const u = new SpeechSynthesisUtterance("Ocorrência apontada como solucionada. Vias operando sem impeditivos.");
                                    u.lang = "pt-BR";
                                    window.speechSynthesis.speak(u);
                                  }
                                }}
                                className={`w-full py-2 border font-mono text-[9px] font-bold uppercase cursor-pointer rounded-none text-center transition-all ${
                                  isDark 
                                    ? "bg-zinc-950 border-emerald-500/40 text-emerald-400 hover:bg-zinc-900" 
                                    : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                                }`}
                              >
                                Finalizar Chamado / Desobstruir Local
                              </button>
                            )}
                          </div>
                        )}
                        
                        {inc.status === "resolvido" && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-semibold mt-1">
                            <CheckSquare size={11} /> RESOLVIDO & SUPORTADO
                          </div>
                        )}

                      </motion.div>
                    ))
                  )}
                </motion.div>

              </div>
            )}

            {/* SUBTAB 2: CARTOGRAPHY MAP */}
            {activeSubTab === "mapa" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-4 flex-wrap pb-2 border-b border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-bold block uppercase">
                    Cartografia Pluvial Integrada
                  </span>
                  
                  <div className={`p-1 border text-[10px] font-mono rounded-none flex gap-1 ${
                    isDark ? "bg-black border-zinc-800" : "bg-slate-100 border-slate-200"
                  }`}>
                    {["all", "flood", "slide", "assets"].map((layName) => (
                      <button
                        key={layName}
                        onClick={() => setActiveLayer(layName as any)}
                        className={`px-2 py-0.5 uppercase cursor-pointer rounded-none transition-all font-bold ${
                          activeLayer === layName 
                            ? isDark
                              ? "bg-[#0c022e] text-white border border-[#8b5cf6]/40"
                              : "bg-white text-[#231263] border border-slate-300"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        }`}
                      >
                        {layName === "all" ? "Tudo" : layName === "flood" ? "Alagações" : layName === "slide" ? "Barreiras" : "Suporte"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-zinc-800 relative z-0">
                  <RecifeMap
                    incidents={crisisState.incidents}
                    shelters={crisisState.shelters}
                    fleet={crisisState.fleet}
                    sensors={crisisState.sensors}
                    stations={crisisState.stations}
                    selectedNeighborhood={selectedNeighborhood}
                    onSelectNeighborhood={onSelectNeighborhood}
                    activeLayer={activeLayer}
                    theme={theme}
                  />
                </div>
              </div>
            )}

            {/* SUBTAB 3: CLINICS AND HYDRO SENSORS */}
            {activeSubTab === "monitoramento" && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Fluvial meters */}
                  <div className={`p-5 border rounded-none shadow-2xs space-y-3.5 transition-colors ${
                    isDark ? "bg-[#0b0c15] border-zinc-900" : "bg-slate-50 border-slate-250"
                  }`}>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider border-b pb-2 flex items-center gap-1.5 border-slate-200 dark:border-zinc-800">
                      <Droplet size={13} className="text-indigo-400" />
                      Linha de Transbordo dos Rios
                    </h4>
                    
                    <div className="space-y-4 pt-1">
                      {crisisState.sensors.map((sens) => {
                        const pctOfCritical = Math.round((sens.currentLevel / sens.criticalLevel) * 100);
                        return (
                          <div 
                            key={sens.id} 
                            className={`p-3 border rounded-none transition-colors ${
                              isDark ? "bg-black/40 border-zinc-900" : "bg-white border-slate-200 shadow-3xs"
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs font-mono mb-1">
                              <span className="font-extrabold text-slate-700 dark:text-slate-200">{sens.riverName}</span>
                              <span className={`px-2 py-0.5 text-[8.5px] font-bold border ${
                                sens.status === "critico" 
                                  ? "bg-red-100 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400" 
                                  : "bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400"
                              }`}>
                                {sens.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex justify-between font-mono text-[10px] text-slate-500 mb-2">
                              <span>Transbordo Crítico: {sens.criticalLevel.toFixed(2)}m</span>
                              <span>Medição: <strong>{sens.currentLevel.toFixed(2)}m</strong></span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-zinc-905 h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${sens.status === "critico" ? "bg-red-500 animate-pulse" : "bg-amber-400"}`}
                                style={{ width: `${Math.min(100, pctOfCritical)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pluviometers */}
                  <div className={`p-5 border rounded-none shadow-2xs space-y-3.5 transition-colors ${
                    isDark ? "bg-[#0b0c15] border-zinc-900" : "bg-slate-50 border-slate-250"
                  }`}>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider border-b pb-2 flex items-center gap-1.5 border-slate-200 dark:border-zinc-800">
                      <TrendingUp size={13} className="text-amber-500" />
                      Índices Pluviométricos (Estações Cemaden)
                    </h4>
                    
                    <div className="space-y-3 pt-1">
                      {crisisState.stations.map((sta) => (
                        <div 
                          key={sta.id} 
                          className={`flex items-center justify-between text-xs p-3 border rounded-none font-mono ${
                            isDark ? "bg-black/40 border-zinc-900" : "bg-white border-slate-200 shadow-3xs"
                          }`}
                        >
                          <div>
                            <span className="font-extrabold block dark:text-slate-100">{sta.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Local: {sta.neighborhood}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">{sta.rainAmount24h.toFixed(1)} mm (24h)</span>
                            <span className={`inline-block py-0.5 px-2 text-[8px] font-bold border mt-1 select-none font-mono ${
                              sta.alertStatus === "vermelho" 
                                ? "bg-red-100 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400" 
                                : "bg-yellow-105 border-yellow-205 text-yellow-800 dark:bg-yellow-950/45 dark:border-yellow-900 dark:text-yellow-400"
                            }`}>
                              Acúmulo 3h: {sta.rainAmount3h.toFixed(1)} mm
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Retaguarda Hospitalar */}
                <div className={`p-5 border rounded-none shadow-2xs space-y-3.5 transition-colors ${
                  isDark ? "bg-[#0b0c15] border-zinc-900" : "bg-slate-50 border-slate-250"
                }`}>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider border-b pb-2 flex items-center gap-1.5 border-slate-200 dark:border-zinc-800">
                    <Activity size={13} className="text-emerald-500" />
                    Situação Georreferenciada de Leitos de Apoio
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {crisisState.hospitals.map((h) => (
                      <div 
                        key={h.id} 
                        className={`flex items-center justify-between text-xs p-3 border rounded-none font-mono ${
                          isDark ? "bg-black/40 border-zinc-900" : "bg-white border-slate-200 shadow-3xs"
                        }`}
                      >
                        <div>
                          <span className="font-extrabold block dark:text-slate-100">{h.name}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Vagas Clínicas: {h.availableBeds} vagas livres</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8.5px] font-bold border ${
                          h.status === "normal"
                            ? "bg-teal-100 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-900 dark:text-teal-400"
                            : "bg-red-100 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400"
                        }`}>
                          {h.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* SUBTAB 4: AI STRATEGIC REPORT BRIEFING */}
            {activeSubTab === "analise_ia" && (
              <div className="space-y-4 max-w-2xl mx-auto py-2">
                <div className="border-b pb-2 border-slate-200 dark:border-zinc-800 text-center md:text-left">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
                    <Briefcase size={14} className="text-indigo-400 animate-pulse" />
                    Gerador de Sumário Executivo — Gemini
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Elabora um boletim de situação técnica e triagem analítica em tempo real baseado nos chamados civis vigentes.</p>
                </div>

                <div className="space-y-4 pt-1.5">
                  <button
                    onClick={generateAiReport}
                    disabled={reportLoading}
                    className="w-full py-3 bg-gradient-to-r from-violet-950 to-indigo-950 hover:from-indigo-900 hover:to-indigo-850 border border-violet-500/40 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    {reportLoading ? "ANISANDO CENTRAL E CHAMADOS..." : "Gerar Briefing Técnico Instantâneo"}
                  </button>

                  {aiReport && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-5 border rounded-none relative overflow-hidden font-sans ${
                        isDark ? "bg-[#0b0c15] border-zinc-900" : "bg-slate-50 border-slate-250 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[#8b5cf6] font-mono text-[10px] font-semibold border-b pb-2 mb-3 border-slate-200 dark:border-zinc-800">
                        <Sparkles size={12} className="animate-pulse" />
                        ACOMPANHAMENTO ANALÍTICO DA DEFESA CIVIL (SUPORTADO POR GEMINI AI)
                      </div>
                      
                      <div className={`text-xs leading-relaxed whitespace-pre-line space-y-2.5 font-medium ${isDark ? "text-slate-300":"text-slate-700"}`}>
                        {cleanMarkdown(aiReport)}
                      </div>

                      {reportSimulated && (
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-zinc-900 text-center text-[9px] font-mono text-amber-500 dark:text-amber-400">
                          * Modo Offline Simulador - Utilizando regras prévias de emergência municipal *
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
