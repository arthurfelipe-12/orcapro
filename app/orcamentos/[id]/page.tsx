"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BotaoPdf from "./pdf";
import BotaoWhatsApp from "./whatsapp";

type Cliente = { nome: string };

type Orcamento = {
  id: string;
  titulo: string;
  escopo: string | null;
  descricao: string | null;
  valor_total: number;
  custo_interno: number | null;
  margem_percentual: number | null;
  validade_dias: number | null;
  prazo_execucao: string | null;
  forma_pagamento: string | null;
  garantia: string | null;
  status: string | null;
  created_at: string;
  clientes: Cliente | null;
};

type Item = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
  material_incluso: boolean | null;
  custo_material: number | null;
};

function DetalheOrcamentoConteudo() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [empresa, setEmpresa] = useState({
    nome: "Minha empresa",
    logo: null as string | null,
  });

  useEffect(() => {
    if (id) {
      carregar();
      carregarEmpresa();
    }
  }, [id]);

  async function carregar() {
    const { data: sessao } = await supabase.auth.getSession();
    if (!sessao.session) {
      router.push("/login");
      return;
    }

    const { data: orc, error } = await supabase
      .from("orcamentos")
      .select(
        "id, titulo, escopo, descricao, valor_total, custo_interno, margem_percentual, validade_dias, prazo_execucao, forma_pagamento, garantia, status, created_at, clientes(nome)"
      )
      .eq("id", id)
      .single();

    if (error || !orc) {
      setErro("Orçamento não encontrado.");
      setCarregando(false);
      return;
    }

    setOrcamento(orc as unknown as Orcamento);

    const { data: itensData } = await supabase
      .from("itens_orcamento")
      .select(
        "id, descricao, quantidade, unidade, valor_unitario, valor_total, material_incluso, custo_material"
      )
      .eq("orcamento_id", id)
      .order("ordem");

    setItens((itensData as Item[]) || []);
    setCarregando(false);
  }

  async function carregarEmpresa() {
    const { data } = await supabase
      .from("configuracoes")
      .select("nome_empresa, logo_url")
      .maybeSingle();

    if (data) {
      setEmpresa({
        nome: data.nome_empresa || "Minha empresa",
        logo: data.logo_url || null,
      });
    }
  }

  async function mudarStatus(novo: string) {
    if (!orcamento) return;
    const { error } = await supabase
      .from("orcamentos")
      .update({ status: novo })
      .eq("id", orcamento.id);

    if (error) {
      setErro(error.message);
      return;
    }
    setOrcamento({ ...orcamento, status: novo });
  }

  async function excluir() {
    if (!orcamento) return;
    if (!confirm("Excluir este orçamento? Essa ação não pode ser desfeita.")) return;

    setExcluindo(true);
    await supabase.from("itens_orcamento").delete().eq("orcamento_id", orcamento.id);
    const { error } = await supabase.from("orcamentos").delete().eq("id", orcamento.id);

    if (error) {
      setExcluindo(false);
      setErro(error.message);
      return;
    }
    router.push("/orcamentos/lista");
  }

  const moeda = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const dataBR = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
        <p className="text-sm text-[#5A5A5A]">Carregando...</p>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#1A1A1A] font-medium mb-3">
            {erro || "Orçamento não encontrado."}
          </p>
          <Link href="/orcamentos/lista" className="text-sm text-[#C2410C] hover:underline">
            Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  const margem = Number(orcamento.margem_percentual || 0);
  const margemBaixa = margem < 20;
  const custoInterno = Number(orcamento.custo_interno || 0);
  const lucro = Number(orcamento.valor_total) - custoInterno;

  const statusCor =
    orcamento.status === "aprovado"
      ? "bg-green-50 text-green-700 border-green-200"
      : orcamento.status === "recusado"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const statusRotulo =
    orcamento.status === "aprovado"
      ? "Aprovado"
      : orcamento.status === "recusado"
      ? "Recusado"
      : "Pendente";

  return (
    <div className="min-h-screen bg-[#FDFBF8]">
      <header className="bg-white border-b border-[#EDE7DF]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#1A1A1A]">OrçaPro</span>
          </Link>
          <Link href="/orcamentos/lista" className="text-sm text-[#5A5A5A] hover:text-[#C2410C]">
            Voltar para a lista
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{orcamento.titulo}</h1>
            <p className="text-sm text-[#5A5A5A]">
              {orcamento.clientes?.nome || "Sem cliente"} · {dataBR(orcamento.created_at)}
            </p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full border shrink-0 ${statusCor}`}>
            {statusRotulo}
          </span>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        {(orcamento.escopo || orcamento.descricao) && (
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
            <h2 className="font-semibold text-[#1A1A1A] mb-2">Escopo do serviço</h2>
            <p className="text-sm text-[#5A5A5A] whitespace-pre-wrap">
              {orcamento.escopo || orcamento.descricao}
            </p>
          </section>
        )}

        <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-[#1A1A1A] mb-3">Itens</h2>
          {itens.length === 0 ? (
            <p className="text-sm text-[#5A5A5A]">Nenhum item cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2 border-b border-[#F2EDE6] last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">{item.descricao}</p>
                    <p className="text-xs text-[#5A5A5A]">
                      {Number(item.quantidade)} {item.unidade} × {moeda(item.valor_unitario)}
                      {item.material_incluso === false && " · só mão de obra"}
                    </p>
                  </div>
                  <strong className="text-sm text-[#1A1A1A] shrink-0">
                    {moeda(item.valor_total)}
                  </strong>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-[#F2EDE6] flex justify-between">
            <span className="text-sm text-[#5A5A5A]">Total</span>
            <strong className="text-lg text-[#1A1A1A]">{moeda(orcamento.valor_total)}</strong>
          </div>
        </section>

        <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-[#1A1A1A] mb-1">Resultado interno</h2>
          <p className="text-xs text-[#5A5A5A] mb-3">
            Só você vê. Não aparece no PDF do cliente.
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[#5A5A5A]">
              <span>Custo total</span>
              <span>{moeda(custoInterno)}</span>
            </div>
            <div className={`flex justify-between font-medium ${lucro >= 0 ? "text-green-700" : "text-red-600"}`}>
              <span>Lucro real</span>
              <span>{moeda(lucro)}</span>
            </div>
            <div className={`flex justify-between font-medium ${margemBaixa ? "text-red-600" : "text-green-700"}`}>
              <span>Margem real</span>
              <span>{margem.toFixed(1)}%</span>
            </div>
          </div>
          {margemBaixa && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-700 font-medium">
                Margem abaixo de 20%. Revise o preço ou reduza o custo.
              </p>
            </div>
          )}
        </section>

        {(orcamento.prazo_execucao ||
          orcamento.forma_pagamento ||
          orcamento.garantia ||
          orcamento.validade_dias) && (
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">Condições</h2>
            <div className="space-y-2 text-sm">
              {orcamento.validade_dias && (
                <div className="flex justify-between">
                  <span className="text-[#5A5A5A]">Validade da proposta</span>
                  <span className="text-[#1A1A1A]">{orcamento.validade_dias} dias</span>
                </div>
              )}
              {orcamento.prazo_execucao && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#5A5A5A] shrink-0">Prazo de execução</span>
                  <span className="text-[#1A1A1A] text-right">{orcamento.prazo_execucao}</span>
                </div>
              )}
              {orcamento.forma_pagamento && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#5A5A5A] shrink-0">Forma de pagamento</span>
                  <span className="text-[#1A1A1A] text-right">{orcamento.forma_pagamento}</span>
                </div>
              )}
              {orcamento.garantia && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#5A5A5A] shrink-0">Garantia</span>
                  <span className="text-[#1A1A1A] text-right">{orcamento.garantia}</span>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <BotaoPdf
            dados={{
              titulo: orcamento.titulo,
              cliente: orcamento.clientes?.nome || "Cliente",
              data: dataBR(orcamento.created_at),
              escopo: orcamento.escopo || orcamento.descricao,
              valor_total: Number(orcamento.valor_total),
              validade_dias: orcamento.validade_dias,
              prazo_execucao: orcamento.prazo_execucao,
              forma_pagamento: orcamento.forma_pagamento,
              garantia: orcamento.garantia,
              empresa: empresa.nome,
              logoUrl: empresa.logo,
              itens: itens,
            }}
          />
          <BotaoWhatsApp
            dados={{
              cliente: orcamento.clientes?.nome || "Cliente",
              titulo: orcamento.titulo,
              valor_total: Number(orcamento.valor_total),
              empresa: empresa.nome,
              validade_dias: orcamento.validade_dias,
              prazo_execucao: orcamento.prazo_execucao,
              forma_pagamento: orcamento.forma_pagamento,
            }}
          />
          <select
            value={orcamento.status || "pendente"}
            onChange={(e) => mudarStatus(e.target.value)}
            className="border border-[#D9D2C8] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
          >
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
          </select>
          <button
            type="button"
            onClick={excluir}
            disabled={excluindo}
            className="border border-[#D9D2C8] text-[#5A5A5A] text-sm font-medium px-4 py-2.5 rounded-lg hover:text-red-600 hover:border-red-200 transition disabled:opacity-60"
          >
            {excluindo ? "Excluindo..." : "Excluir"}
          </button>
          <Link
            href="/orcamentos/lista"
            className="ml-auto border border-[#D9D2C8] text-[#5A5A5A] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white transition"
          >
            Voltar
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function DetalheOrcamento() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
          <p className="text-sm text-[#5A5A5A]">Carregando...</p>
        </div>
      }
    >
      <DetalheOrcamentoConteudo />
    </Suspense>
  );
}
