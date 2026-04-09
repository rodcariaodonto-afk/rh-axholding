import { useState } from "react";
import LegalPageLayout from "@/components/LegalPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, PenLine, Trash2, Lock, ArrowRightLeft, XCircle } from "lucide-react";

const sections = [
  { id: "direitos", label: "Seus Direitos" },
  { id: "formulario", label: "Enviar Solicitação" },
];

const rights = [
  { icon: Eye, title: "Confirmação e Acesso", desc: "Solicitar a confirmação da existência de tratamento e o acesso aos seus dados pessoais coletados (Nome, E-mail, Telefone)." },
  { icon: PenLine, title: "Correção", desc: "Solicitar a correção de dados pessoais incompletos, inexatos ou desatualizados." },
  { icon: Trash2, title: "Eliminação", desc: "Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD." },
  { icon: Lock, title: "Anonimização e Bloqueio", desc: "Solicitar a anonimização ou bloqueio de dados pessoais quando aplicável." },
  { icon: ArrowRightLeft, title: "Portabilidade", desc: "Solicitar a portabilidade dos seus dados pessoais a outro fornecedor de serviço ou produto." },
  { icon: XCircle, title: "Revogação do Consentimento", desc: "Revogar o consentimento previamente concedido para o tratamento dos seus dados pessoais a qualquer momento." },
];

export default function LgpdPortal() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", request_type: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.request_type) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (!confirmed) {
      toast({ title: "Confirme que você é o titular dos dados", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("lgpd_requests").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      request_type: form.request_type,
      message: form.message.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente mais tarde.", variant: "destructive" });
    } else {
      toast({ title: "Solicitação enviada com sucesso!", description: "Retornaremos em até 15 dias úteis." });
      setForm({ name: "", email: "", request_type: "", message: "" });
      setConfirmed(false);
    }
  };

  return (
    <LegalPageLayout title="Portal LGPD — Direitos do Titular" sections={sections}>
      {/* Badges */}
      <div className="flex flex-wrap gap-3 mb-8">
        <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-4 py-1.5 text-sm font-medium">
          <Shield size={14} /> LGPD Compliant
        </span>
        <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm font-medium">
          <Shield size={14} /> SOC 2 Type II
        </span>
      </div>

      <p className="mb-8">
        A <strong>RHAxis</strong> está comprometida com a transparência e a proteção dos seus dados pessoais. Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode exercer os direitos abaixo a qualquer momento.
      </p>

      {/* Section 1: Rights */}
      <section id="direitos" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-6">Seus Direitos como Titular</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {rights.map((r) => (
            <div key={r.title} className="bg-white/5 border border-white/10 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <r.icon size={18} className="text-blue-400 shrink-0" />
                <h3 className="font-semibold text-white text-sm">{r.title}</h3>
              </div>
              <p className="text-sm text-gray-400">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Form */}
      <section id="formulario" className="mb-10">
        <h2 className="text-2xl font-semibold text-white mb-6">Enviar Solicitação</h2>
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-5 max-w-lg">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">Nome Completo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome completo"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">E-mail utilizado no cadastro *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              maxLength={255}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">Tipo de Solicitação *</Label>
            <select
              value={form.request_type}
              onChange={(e) => setForm({ ...form, request_type: e.target.value })}
              className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
            >
              <option value="" className="bg-[#0a1628]">Selecione...</option>
              <option value="Acesso aos Dados" className="bg-[#0a1628]">Acesso aos Dados</option>
              <option value="Correção de Dados" className="bg-[#0a1628]">Correção de Dados</option>
              <option value="Exclusão de Dados" className="bg-[#0a1628]">Exclusão de Dados</option>
              <option value="Portabilidade" className="bg-[#0a1628]">Portabilidade</option>
              <option value="Revogação de Consentimento" className="bg-[#0a1628]">Revogação de Consentimento</option>
              <option value="Outros" className="bg-[#0a1628]">Outros</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">Mensagem / Detalhes</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Descreva sua solicitação..."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 min-h-[100px]"
              maxLength={1000}
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
              className="mt-0.5 border-white/30 data-[state=checked]:bg-blue-600"
            />
            <label htmlFor="confirm" className="text-sm text-gray-400 cursor-pointer">
              Declaro que sou o titular dos dados ou representante legal autorizado.
            </label>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
            {loading ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </form>
      </section>
    </LegalPageLayout>
  );
}
