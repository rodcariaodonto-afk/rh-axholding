import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Brain, BarChart3, DollarSign, Activity,
  CheckCircle2, ArrowRight, Shield, Menu, X,
  TrendingUp, Clock, Zap, ChevronRight, MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

/* ───────── animated counter ───────── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let cur = 0;
          const step = Math.max(1, Math.floor(target / 40));
          const id = setInterval(() => {
            cur += step;
            if (cur >= target) { cur = target; clearInterval(id); }
            setVal(cur);
          }, 30);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="text-5xl md:text-6xl font-extrabold text-white">{val}{suffix}</div>;
}

/* ───────── modules data ───────── */
const modules = [
  {
    key: "people",
    label: "AX People",
    icon: Users,
    title: "Automação de Departamento Pessoal",
    desc: "Elimine processos manuais e reduza erros operacionais com automação completa de DP.",
    features: ["Admissão 100% digital", "Ponto eletrônico integrado", "Holerite online", "Gestão de férias e afastamentos", "Controle de documentos (LGPD)"],
  },
  {
    key: "talent",
    label: "AX Talent",
    icon: Brain,
    title: "Recrutamento & Desenvolvimento",
    desc: "Atraia, desenvolva e retenha os melhores talentos com ferramentas inteligentes.",
    features: ["Recrutamento & Seleção com IA", "Onboarding automatizado", "Avaliação de desempenho 360°", "PDI com acompanhamento", "Banco de talentos unificado"],
  },
  {
    key: "analytics",
    label: "AX Analytics",
    icon: BarChart3,
    title: "People Analytics Estratégico",
    desc: "Dashboards em tempo real para decisões baseadas em dados pelo CHRO.",
    features: ["Dashboard executivo C-Level", "Indicadores de turnover e absenteísmo", "Análise de clima organizacional", "Relatórios customizáveis", "Exportação para board reports"],
  },
  {
    key: "pay",
    label: "AX Pay",
    icon: DollarSign,
    title: "Folha de Pagamento Digital",
    desc: "Processamento de folha integrado, seguro e em conformidade com a legislação.",
    features: ["Cálculo automático de encargos", "Integração bancária", "eSocial automatizado", "Simulação de cenários", "Histórico de compensação"],
  },
  {
    key: "pulse",
    label: "AX Pulse (IA)",
    icon: Activity,
    title: "IA Preditiva & Clima",
    desc: "Algoritmos de machine learning que antecipam riscos e oportunidades de pessoas.",
    features: ["Predição de turnover com 90%+ precisão", "Pesquisas de pulso contínuas", "Alertas automáticos de risco", "Recomendações de ação por IA", "Score de engajamento em tempo real"],
  },
];

/* ───────── pricing data ───────── */
const plans = [
  {
    name: "STARTER",
    price: "R$ 197",
    period: "/mês fixo",
    range: "10 a 50 colaboradores",
    features: ["AX People completo", "Ponto eletrônico", "Holerite digital", "Suporte por email"],
    highlighted: false,
  },
  {
    name: "GROWTH",
    price: "R$ 19",
    period: "/colaborador/mês",
    range: "51 a 200 colaboradores",
    features: ["Tudo do Starter", "AX Talent", "Avaliação de desempenho", "Onboarding digital", "Suporte prioritário"],
    highlighted: false,
  },
  {
    name: "PRO",
    price: "R$ 29",
    period: "/colaborador/mês",
    range: "201 a 500 colaboradores",
    features: ["Tudo do Growth", "AX Analytics", "AX Pulse (IA Preditiva)", "People Analytics completo", "Predição de turnover", "Gerente de sucesso dedicado"],
    highlighted: true,
  },
  {
    name: "ENTERPRISE",
    price: "Sob consulta",
    period: "",
    range: "500+ ou multi-CNPJ",
    features: ["Tudo do Pro", "AX Pay (Folha)", "Multi-CNPJ / Multi-unidade", "API & integrações customizadas", "SLA dedicado", "Implantação assistida"],
    highlighted: false,
  },
];

export default function LandingPage() {
  const WHATSAPP_URL = "https://wa.me/5511960011555?text=Olá! Gostaria de falar com um consultor sobre o RH Smart IA.";

  const { toast } = useToast();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", cargo: "", empresa: "", num_funcionarios: "", email: "" });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  const openWhatsApp = () => window.open(WHATSAPP_URL, "_blank");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cargo || !form.empresa || !form.num_funcionarios || !form.email) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("b2b_leads" as any).insert([{ ...form, origem: "landing" }]);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
    } else {
      toast({ title: "Recebemos seu contato!", description: "Nossa equipe entrará em contato em até 24h." });
      setForm({ nome: "", cargo: "", empresa: "", num_funcionarios: "", email: "" });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <span className="text-xl font-bold text-white tracking-tight">
            RH Smart <span className="text-blue-400">IA</span>
          </span>

          {/* desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            {[["Módulos", "modulos"], ["Vantagens", "resultados"], ["Preços", "precos"], ["Contato", "contato"]].map(
              ([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors">
                  {label}
                </button>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">Entrar</Button>
            </Link>
            <Button onClick={() => scrollTo("contato")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Agendar Demo Gratuita
            </Button>
          </div>

          {/* mobile hamburger */}
          <button className="md:hidden text-white" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-[#0a1628] border-t border-white/10 px-4 pb-4 space-y-3">
            {[["Módulos", "modulos"], ["Vantagens", "resultados"], ["Preços", "precos"], ["Contato", "contato"]].map(
              ([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-gray-300 hover:text-white py-2">
                  {label}
                </button>
              )
            )}
            <Link to="/auth" className="block">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300">Entrar</Button>
            </Link>
            <Button onClick={() => scrollTo("contato")} className="w-full bg-blue-600 text-white">Agendar Demo</Button>
          </div>
        )}
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#162a52] overflow-hidden">
        {/* decorative elements */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500/30">
              <Zap size={14} /> Plataforma #1 de RH com IA no Brasil
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Transforme seu RH em um{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Centro de Resultados
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
              A única plataforma brasileira que combina automação de departamento pessoal, desenvolvimento de talentos e People Analytics com IA preditiva. ROI comprovado desde o primeiro mês.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => scrollTo("contato")} className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 text-base">
                Agendar Demo Gratuita <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo("modulos")} className="border-gray-600 text-gray-300 hover:bg-white/10 h-12 px-6 text-base">
                Conhecer Módulos
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-green-400" /> LGPD Compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> SOC 2 Type II</span>
            </div>
          </div>

          {/* dashboard mockup */}
          <div className="relative hidden md:block">
            <div className="bg-[#111b2e] rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">People Analytics Dashboard</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Live</span>
              </div>
              {/* metric cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Turnover", value: "8.2%", trend: "↓ 34%", color: "text-green-400" },
                  { label: "Engajamento", value: "87%", trend: "↑ 12%", color: "text-blue-400" },
                  { label: "eNPS", value: "+62", trend: "↑ 8pts", color: "text-cyan-400" },
                ].map((m) => (
                  <div key={m.label} className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                    <p className="text-lg font-bold text-white">{m.value}</p>
                    <p className={`text-xs ${m.color}`}>{m.trend}</p>
                  </div>
                ))}
              </div>
              {/* chart placeholder */}
              <div className="bg-white/5 rounded-lg p-4 h-32 flex items-end gap-1">
                {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
              {/* alert */}
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <Activity size={16} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-300">Alerta Preditivo</p>
                  <p className="text-[10px] text-gray-400">3 colaboradores com risco elevado de turnover identificados pela IA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MÓDULOS ═══════ */}
      <section id="modulos" className="py-20 md:py-28 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">A Plataforma All-in-One</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">5 módulos. Uma única plataforma.</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Do operacional ao estratégico, tudo integrado para transformar a gestão de pessoas da sua empresa.</p>
          </div>

          <Tabs defaultValue="people" className="w-full">
            <TabsList className="w-full flex flex-wrap justify-center gap-1 bg-transparent h-auto mb-8">
              {modules.map((m) => (
                <TabsTrigger
                  key={m.key}
                  value={m.key}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 data-[state=inactive]:border data-[state=inactive]:border-gray-200 data-[state=inactive]:shadow-sm transition-all"
                >
                  <m.icon size={16} />
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {modules.map((m) => (
              <TabsContent key={m.key} value={m.key}>
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        <m.icon size={16} /> {m.label}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{m.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{m.desc}</p>
                      <ul className="space-y-2.5">
                        {m.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* module illustration */}
                    <div className="bg-gradient-to-br from-[#0a1628] to-[#162a52] rounded-xl p-6 h-64 flex items-center justify-center">
                      <m.icon size={80} className="text-blue-400/30" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* ═══════ RESULTADOS ═══════ */}
      <section id="resultados" className="py-20 md:py-28 bg-gradient-to-br from-[#0a1628] to-[#162a52]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-2">O Poder da IA</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Resultados comprovados por nossos clientes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { target: 34, suffix: "%", label: "Redução média de turnover no 1º ano", icon: TrendingUp },
              { target: 60, suffix: "h", label: "Economizadas por mês em tarefas operacionais", icon: Clock },
              { target: 1, suffix: "", label: "Mês para atingir ROI positivo", icon: Zap, display: "Mês 1" },
            ].map((m, i) => (
              <div key={i} className="text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600/20">
                  <m.icon size={24} className="text-blue-400" />
                </div>
                {m.display ? (
                  <div className="text-5xl md:text-6xl font-extrabold text-white">{m.display}</div>
                ) : (
                  <AnimatedNumber target={m.target} suffix={m.suffix} />
                )}
                <p className="text-gray-400 text-sm">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PREÇOS ═══════ */}
      <section id="precos" className="py-20 md:py-28 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">Planos & Preços</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Escolha o plano ideal para sua empresa</h2>
            <p className="text-gray-500 mt-3">Todos os planos incluem suporte, atualizações e segurança LGPD.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  p.highlighted
                    ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl shadow-blue-600/20 ring-2 ring-blue-400/50 relative"
                    : "bg-white border border-gray-200 text-gray-900 shadow-sm"
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-[#0a1628] text-xs font-bold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                )}
                <p className={`text-xs font-bold uppercase tracking-wider ${p.highlighted ? "text-blue-200" : "text-gray-500"}`}>{p.name}</p>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  {p.period && <span className={`text-sm ${p.highlighted ? "text-blue-200" : "text-gray-500"}`}>{p.period}</span>}
                </div>
                <p className={`text-xs mb-6 ${p.highlighted ? "text-blue-200" : "text-gray-400"}`}>{p.range}</p>
                <ul className="space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${p.highlighted ? "text-cyan-300" : "text-green-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => scrollTo("contato")}
                  className={`mt-6 w-full ${
                    p.highlighted
                      ? "bg-white text-blue-700 hover:bg-gray-100"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {p.name === "ENTERPRISE" ? "Falar com Vendas" : "Começar Agora"} <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FORMULÁRIO B2B ═══════ */}
      <section id="contato" className="py-20 md:py-28 bg-gradient-to-br from-[#0a1628] to-[#162a52]">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-2">Agende sua Demo</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Veja o RH Smart IA em ação</h2>
            <p className="text-gray-400 mt-3">Preencha o formulário e nossa equipe entrará em contato em até 24 horas úteis.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Nome completo *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Seu nome"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-400"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Cargo *</Label>
                <Input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Diretor de RH"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-400"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Empresa *</Label>
                <Input
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  placeholder="Nome da empresa"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-400"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Nº de funcionários *</Label>
                <select
                  value={form.num_funcionarios}
                  onChange={(e) => setForm({ ...form, num_funcionarios: e.target.value })}
                  className="w-full h-9 rounded-md bg-white/10 border border-white/20 text-white text-sm px-3 focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="text-gray-900">Selecione</option>
                  <option value="10-50" className="text-gray-900">10 a 50</option>
                  <option value="51-200" className="text-gray-900">51 a 200</option>
                  <option value="201-500" className="text-gray-900">201 a 500</option>
                  <option value="500+" className="text-gray-900">500+</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Email corporativo *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seu@empresa.com.br"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-400"
                maxLength={255}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base">
              {loading ? "Enviando..." : "Agendar Demo Gratuita"} {!loading && <ArrowRight size={18} className="ml-2" />}
            </Button>
            <p className="text-center text-xs text-gray-500">
              <Shield size={12} className="inline mr-1" />
              Seus dados estão protegidos conforme a LGPD. Não compartilhamos suas informações.
            </p>
          </form>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-[#070e1a] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="text-lg font-bold text-white">RH Smart <span className="text-blue-400">IA</span></span>
              <p className="text-sm text-gray-500 mt-2">Uma solução <span className="font-semibold text-gray-400">AX Holding</span></p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Produto</p>
              <ul className="space-y-2 text-sm text-gray-500">
                {["AX People", "AX Talent", "AX Analytics", "AX Pay", "AX Pulse"].map((l) => (
                  <li key={l}><button onClick={() => scrollTo("modulos")} className="hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Empresa</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><button onClick={() => scrollTo("resultados")} className="hover:text-white transition-colors">Sobre nós</button></li>
                <li><button onClick={() => scrollTo("precos")} className="hover:text-white transition-colors">Preços</button></li>
                <li><button onClick={() => scrollTo("contato")} className="hover:text-white transition-colors">Contato</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><span className="hover:text-white transition-colors cursor-pointer">Política de Privacidade</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Termos de Uso</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">LGPD</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} AX Holding. Todos os direitos reservados. CNPJ: 00.000.000/0001-00
          </div>
        </div>
      </footer>

      {/* ═══════ WHATSAPP FLOATING BUTTON ═══════ */}
      <a
        href="https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o RH Smart IA."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full px-5 py-3 shadow-lg shadow-green-500/30 transition-all hover:scale-105"
      >
        <MessageCircle size={22} />
        <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span>
      </a>
    </div>
  );
}
