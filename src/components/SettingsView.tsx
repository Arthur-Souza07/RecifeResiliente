import React from "react";
import { motion } from "motion/react";
import {
  Sun,
  Moon,
  Volume2,
  Cpu,
  Mic,
  Shield,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Activity,
  User,
  Smartphone
} from "lucide-react";
import Logo from "./Logo";

interface SettingsViewProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  userPhone: string;
}

export default function SettingsView({
  theme,
  onToggleTheme,
  isVoiceActive,
  onToggleVoice,
  userPhone,
}: SettingsViewProps) {
  const isDark = theme === "dark";

  // Card container animations
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Title block */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
            <Smartphone className="text-[#8b5cf6]" size={20} />
            Configurações da Plataforma
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider mt-1">
            Personalize a visualização, acessibilidade e parâmetros operacionais
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1">
          <span>Celular Registrado:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{userPhone}</span>
        </div>
      </motion.div>

      {/* Grid containing options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Aspect 1: Theme Selector Card */}
        <motion.div
          variants={itemVariants}
          className={`p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
            isDark
              ? "bg-[#0e0f17] border-[#8b5cf6]/10 text-white shadow-xl"
              : "bg-white border-slate-200 text-slate-800 shadow-xs"
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-sky-500" />
          
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-2">
                  {isDark ? <Moon className="text-[#a78bfa]" size={16} /> : <Sun className="text-amber-500" size={16} />}
                  Aparência Visual
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Selecione o tema para melhor conforto operacional. Por padrão, o sistema opera no modo claro, projetado para excelente legibilidade operacional diurna.
                </p>
              </div>
            </div>

            {/* Slider Switch Design */}
            <div className="flex flex-col space-y-4 pt-3">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-zinc-800/40">
                <span className="text-xs font-semibold uppercase font-mono">Status do Tema Escuro</span>
                <button
                  onClick={onToggleTheme}
                  className={`w-14 h-7 rounded-full p-1 transition-colors relative cursor-pointer outline-none ${
                    isDark ? "bg-[#8b5cf6]" : "bg-slate-300"
                  }`}
                >
                  <motion.div
                    layout
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ x: isDark ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => theme !== "light" && onToggleTheme()}
                  className={`py-2 text-[10px] font-mono tracking-wider uppercase border text-center transition-all cursor-pointer ${
                    !isDark
                      ? "bg-amber-50 border-amber-300 text-amber-800 font-bold"
                      : "bg-transparent border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Modo Claro (Padrão)
                </button>
                <button
                  onClick={() => theme !== "dark" && onToggleTheme()}
                  className={`py-2 text-[10px] font-mono tracking-wider uppercase border text-center transition-all cursor-pointer ${
                    isDark
                      ? "bg-violet-950/40 border-[#8b5cf6] text-white font-bold"
                      : "bg-transparent border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-[#231263]"
                  }`}
                >
                  Modo Escuro
                </button>
              </div>
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-normal border-t border-slate-100 dark:border-zinc-800/60 pt-4 mt-6">
            O modo escuro otimiza energia de dispositivos móveis e reduz a estafa visual em operações noturnas e preventivas sob tempestades.
          </div>
        </motion.div>

        {/* Aspect 2: Accessibility and Voice commands */}
        <motion.div
          variants={itemVariants}
          className={`p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
            isDark
              ? "bg-[#0e0f17] border-[#8b5cf6]/10 text-white shadow-xl"
              : "bg-white border-slate-200 text-slate-800 shadow-xs"
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-emerald-500" />

          <div className="space-y-4">
            <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-2">
              <Mic className="text-sky-500 animate-pulse" size={16} />
              Navegação por Controle de Voz
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              A Defesa Civil do Recife fornece comandos de voz assistidos via Web Speech API para cidadãos em locomoção ou com restrições motoras em ambiente de estresse.
            </p>

            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-zinc-800/40 pt-1">
              <span className="text-xs font-semibold uppercase font-mono">Leitor e Escuta Ativa</span>
              <button
                onClick={onToggleVoice}
                className={`px-3 py-1.5 font-mono text-[9px] font-bold uppercase transition-all border ${
                  isVoiceActive
                    ? "bg-violet-950 text-white border-[#8b5cf6]"
                    : "bg-slate-100 dark:bg-zinc-900 text-slate-500 border-slate-300 dark:border-zinc-800 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {isVoiceActive ? "VOZ ATIVADA" : "ATIVAR ESCUTA"}
              </button>
            </div>

            {/* Instruction list */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#a78bfa] block font-bold">Comandos de Voz Suportados:</span>
              <ul className="text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc">
                <li><strong className="text-slate-700 dark:text-slate-200">"Portal"</strong> ou <strong className="text-slate-700 dark:text-slate-200">"Cidadão"</strong> — Alterna para o Portal do Cidadão</li>
                <li><strong className="text-slate-700 dark:text-slate-200">"Gabinete"</strong> ou <strong className="text-slate-700 dark:text-slate-200">"Painel"</strong> — Abre o Gabinete de Crise</li>
                <li><strong className="text-slate-700 dark:text-slate-200">"Leitura"</strong> — Narra estatísticas ativas por áudio sintetizado</li>
                <li><strong className="text-slate-700 dark:text-slate-200">"Ajuda"</strong> — Explica comandos válidos audivelmente</li>
              </ul>
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
            A Web Speech API requer autorização do microfone corporativo ou civil e navegador Google Chrome para ótimo desempenho.
          </div>
        </motion.div>

        {/* Aspect 3: AI Engine Info (Full Span) */}
        <motion.div
          variants={itemVariants}
          className={`md:col-span-2 p-6 border transition-all relative overflow-hidden ${
            isDark
              ? "bg-[#0e0f17] border-[#8b5cf6]/10 text-white shadow-xl"
              : "bg-white border-slate-200 text-slate-800 shadow-xs"
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_70%)] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-2">
                <Cpu className="text-cyan-500" size={16} />
                Integração Inteligente — Gemini AI
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Nossos fluxos críticos de tomada de decisões são avaliados por meio da inteligência artificial do Google Gemini. Cada chamado ou rumor reportado de alagamentos e desmoronamentos passa por análises estruturadas para evitar sobrecarga de defesas civis civicamente.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-left">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Trier de Ocorrências</span>
                  <span className="text-xs text-slate-700 dark:text-slate-200 mt-1 block">Classificação automática de severidade e alocação de equipes</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-left">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Fatos vs Boatos</span>
                  <span className="text-xs text-slate-700 dark:text-slate-200 mt-1 block">Verificador baseado em dados confiáveis de órgãos públicos</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-left">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Geração de Briefings</span>
                  <span className="text-xs text-slate-700 dark:text-slate-200 mt-1 block">Briefings e relatórios operacionais automáticos gerados por IA</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 w-full md:w-56 text-center select-none shrink-0">
              <Logo layout="vertical" size="sm" isDarkBg={isDark} />
            </div>
          </div>
        </motion.div>
        
      </div>

    </motion.div>
  );
}
