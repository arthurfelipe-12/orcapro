"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verificarTrial, type StatusTrial } from "@/lib/trial";

function textoDiasRestantes(dias: number): string {
  if (dias <= 0) return "Teste encerrado";
  if (dias === 1) return "Último dia de teste";
  return `${dias} dias restantes de teste`;
}

export default function Dashboard() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [trial, setTrial] = useState<StatusTrial | null>(null);
  const [email, setEmail] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [totalOrcamentos, setTotalOrcamentos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [valorAprovado, setValorAprovado] = useState(0);

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    const intervalo = setInterval(async () => {
      const novo = await verificarTrial();

      if (novo.expirado) {
        router.push("/bloqueado");
        return;
      }

      setTrial(novo);
    }, 60 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [router]);

  async function carregar() {
    try {
      const { data: sessao } = await supabase.auth.getSession();

      if (!sessao.session) {
        router.push("/login");
        return;
      }

      setEmail(sessao.session.user.email || "");

      const status = await verificarTrial();

      if (status.expirado) {
        router.push("/bloqueado");
        return;
      }

      setTrial(status);

      const userId = sessao.session.user.id;

      const { data: config } = await supabase
        .from("configuracoes")
        .select("nome_empresa, logo_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (config?.nome_empresa) setNomeEmpresa(config.nome_empresa);
      if (config?.logo_url) setLogoUrl(config.logo_url);

      const { count: qtdOrcamentos } = await supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true });

      setTotalOrcamentos(qtdOrcamentos || 0);

      const { count: qtdClientes } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true });

      setTotalClientes(qtdClientes || 0);

      const { data: aprovados } = await supabase
        .from("orcamentos")
        .select("valor_total")
        .eq("status", "aprovado");

      const soma = (aprovados || []).reduce(
        (acc, o) => acc + Number(o.valor_total || 0),
        0
      );

      setValorAprovado(soma);
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
      setErro("Não foi possível carregar os dados. Recarregue a página.");
    } finally {
      setCarregando(false);
    }
  }

  const moeda = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
        <p className="text-sm text-[#5A5A5A]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF8]">
      <header className="bg-white border-b border-[#EDE7DF]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#1A1A1A]">OrçaPro</span>
          </Link>
          <Link
            href="/minha-empresa"
            className="text-sm text-[#5A5A5A] hover:text-[#C2410C]"
          >
            Minha empresa
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">
            Olá{nomeEmpresa ? `, ${nomeEmpresa}` : ""}
          </h1>
          <p className="text-sm text-[#5A5A5A]">{email}</p>

          {trial && (
            <p
              className={`text-sm font-medium mt-2 ${
                trial.diasRestantes <= 5 ? "text-red-600" : "text-[#C2410C]"
              }`}
            >
              {textoDiasRestantes(trial.diasRestantes)}
            </p>
          )}
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-6">
            {erro}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-[#EDE7DF] rounded-xl p-5">
            <p className="text-xs text-[#5A5A5A] mb-1">Orçamentos</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{totalOrcamentos}</p>
          </div>
          <div className="bg-white border border-[#EDE7DF] rounded-xl p-5">
            <p className="text-xs text-[#5A5A5A] mb-1">Clientes</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{totalClientes}</p>
          </div>
          <div className="bg-white border border-[#EDE7DF] rounded-xl p-5">
            <p className="text-xs text-[#5A5A5A] mb-1">Aprovado</p>
            <p className="text-2xl font-bold text-green-700">{moeda(valorAprovado)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/orcamentos"
            className="bg-[#C2410C] text-white font-medium px-5 py-4 rounded-xl hover:bg-[#9A3412] transition text-center"
          >
            + Novo orçamento
          </Link>
          <Link
            href="/orcamentos/lista"
            className="bg-white border border-[#EDE7DF] text-[#1A1A1A] font-medium px-5 py-4 rounded-xl hover:border-[#C2410C] transition text-center"
          >
            Ver meus orçamentos
          </Link>
          <Link
            href="/clientes"
            className="bg-white border border-[#EDE7DF] text-[#1A1A1A] font-medium px-5 py-4 rounded-xl hover:border-[#C2410C] transition text-center"
          >
            Clientes
          </Link>
          <Link
            href="/minha-empresa"
            className="bg-white border border-[#EDE7DF] text-[#1A1A1A] font-medium px-5 py-4 rounded-xl hover:border-[#C2410C] transition text-center"
          >
            Minha empresa
          </Link>
        </div>

        {logoUrl && (
          <div className="mt-8 bg-white border border-[#EDE7DF] rounded-xl p-5 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo da empresa"
              className="h-14 max-w-[140px] object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A]">
                {nomeEmpresa || "Sua empresa"}
              </p>
              <Link
                href="/minha-empresa"
                className="text-xs text-[#C2410C] hover:underline"
              >
                Editar nome e logo
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
