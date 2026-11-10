"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verificarTrial } from "@/lib/trial";

type Orcamento = {
  id: string;
  titulo: string;
  valor_total: number;
  margem_percentual: number;
  status: string | null;
  created_at: string;
  clientes: { nome: string } | null;
};

const STATUS = [
  { valor: "pendente", rotulo: "Pendente", cor: "bg-amber-50 text-amber-700 border-amber-200" },
  { valor: "aprovado", rotulo: "Aprovado", cor: "bg-green-50 text-green-700 border-green-200" },
  { valor: "recusado", rotulo: "Recusado", cor: "bg-red-50 text-red-700 border-red-200" },
];

export default function ListaOrcamentos() {
  const router = useRouter();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const { data: sessao } = await supabase.auth.getSession();

      if (!sessao.session) {
        router.push("/login");
        return;
      }

      const trial = await verificarTrial();

      if (trial.expirado) {
        router.push("/bloqueado");
        return;
      }

      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, titulo, valor_total, margem_percentual, status, created_at, clientes(nome)")
        .order("created_at", { ascending: false });

      if (error) {
        setErro(error.message);
      } else {
        setOrcamentos((data as unknown as Orcamento[]) || []);
      }
    } catch (e) {
      console.error("Erro ao carregar orçamentos:", e);
      setErro("Não foi possível carregar os dados. Recarregue a página.");
    } finally {
      setCarregando(false);
    }
  }

  async function mudarStatus(id: string, novo: string) {
    const { error } = await supabase
      .from("orcamentos")
      .update({ status: novo })
      .eq("id", id);

    if (error) {
      setErro(error.message);
      return;
    }

    setOrcamentos((lista) =>
      lista.map((o) => (o.id === id ? { ...o, status: novo } : o))
    );
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este orçamento? Essa ação não pode ser desfeita.")) return;

    setExcluindo(id);
    setErro("");

    const { error: erroItens } = await supabase
      .from("itens_orcamento")
      .delete()
      .eq("orcamento_id", id);

    if (erroItens) {
      setExcluindo(null);
      setErro(erroItens.message);
      return;
    }

    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    setExcluindo(null);

    if (error) {
      setErro(error.message);
      return;
    }

    setOrcamentos((lista) => lista.filter((o) => o.id !== id));
  }

  const moeda = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const dataBR = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const corStatus = (s: string | null) =>
    STATUS.find((x) => x.valor === (s || "pendente"))?.cor ||
    "bg-amber-50 text-amber-700 border-amber-200";

  const rotuloStatus = (s: string | null) =>
    STATUS.find((x) => x.valor === (s || "pendente"))?.rotulo || "Pendente";

  const totalGeral = orcamentos.reduce((s, o) => s + Number(o.valor_total || 0), 0);
  const aprovados = orcamentos.filter((o) => o.status === "aprovado");
  const totalAprovado = aprovados.reduce((s, o) => s + Number(o.valor_total || 0), 0);

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
          <Link href="/dashboard" className="text-sm text-[#5A5A5A] hover:text-[#C2410C]">
            Voltar ao painel
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Meus orçamentos</h1>
            <p className="text-sm text-[#5A5A5A]">
              Acompanhe o que está pendente, aprovado e quanto você já fechou.
            </p>
          </div>
          <Link
            href="/orcamentos"
            className="bg-[#C2410C] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#9A3412] transition shrink-0"
          >
            + Novo orçamento
          </Link>
        </div>

        {orcamentos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-[#EDE7DF] rounded-xl p-4">
              <p className="text-xs text-[#5A5A5A] mb-1">Total de orçamentos</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{orcamentos.length}</p>
            </div>
            <div className="bg-white border border-[#EDE7DF] rounded-xl p-4">
              <p className="text-xs text-[#5A5A5A] mb-1">Valor em aberto</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{moeda(totalGeral)}</p>
            </div>
            <div className="bg-white border border-[#EDE7DF] rounded-xl p-4">
              <p className="text-xs text-[#5A5A5A] mb-1">Aprovado ({aprovados.length})</p>
              <p className="text-xl font-bold text-green-700">{moeda(totalAprovado)}</p>
            </div>
          </div>
        )}

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        {carregando ? (
          <p className="text-sm text-[#5A5A5A]">Carregando...</p>
        ) : orcamentos.length === 0 ? (
          <div className="bg-white border border-[#EDE7DF] rounded-2xl p-10 text-center">
            <p className="text-[#1A1A1A] font-medium mb-1">Nenhum orçamento ainda</p>
            <p className="text-sm text-[#5A5A5A] mb-4">Crie o primeiro e ele aparece aqui.</p>
            <Link
              href="/orcamentos"
              className="inline-block bg-[#C2410C] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#9A3412] transition"
            >
              Criar orçamento
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orcamentos.map((o) => {
              const margem = Number(o.margem_percentual || 0);
              const margemBaixa = margem < 20;

              return (
                <div key={o.id} className="bg-white border border-[#EDE7DF] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#1A1A1A] truncate">{o.titulo}</h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${corStatus(o.status)}`}
                        >
                          {rotuloStatus(o.status)}
                        </span>
                      </div>
                      <p className="text-sm text-[#5A5A5A]">
                        {o.clientes?.nome || "Sem cliente"} · {dataBR(o.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#1A1A1A]">{moeda(o.valor_total)}</p>
                      <p
                        className={`text-xs font-medium ${
                          margemBaixa ? "text-red-600" : "text-green-700"
                        }`}
                      >
                        Margem {margem.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F2EDE6]">
                    <select
                      value={o.status || "pendente"}
                      onChange={(e) => mudarStatus(o.id, e.target.value)}
                      className="text-xs border border-[#D9D2C8] rounded-lg px-2 py-1.5 text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="recusado">Recusado</option>
                    </select>
                    <Link
                      href={`/orcamentos/${o.id}`}
                      className="text-xs font-medium text-[#C2410C] hover:underline"
                    >
                      Abrir
                    </Link>
                    <button
                      type="button"
                      onClick={() => excluir(o.id)}
                      disabled={excluindo === o.id}
                      className="text-xs text-[#5A5A5A] hover:text-red-600 ml-auto disabled:opacity-60"
                    >
                      {excluindo === o.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
