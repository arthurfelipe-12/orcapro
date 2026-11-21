"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BotaoPdfOs from "./pdf";

type Os = {
  id: string;
  numero: number;
  ano: number;
  titulo: string;
  contratempo: string;
  servico_extra: string;
  valor_extra: number;
  desconto_tipo: string | null;
  desconto_valor: number | null;
  valor_final: number;
  prazo_extra: string | null;
  forma_pagamento: string | null;
  status: string | null;
  created_at: string;
  orcamentos: { titulo: string; clientes: { nome: string } | null } | null;
};

type Imagem = { id: string; url: string; ordem: number };

function DetalheOsConteudo() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [os, setOs] = useState<Os | null>(null);
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [empresa, setEmpresa] = useState({
    nome: "Minha empresa",
    logo: null as string | null,
    assinatura: null as string | null,
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

    const { data, error } = await supabase
      .from("ordens_servico")
      .select(
        "id, numero, ano, titulo, contratempo, servico_extra, valor_extra, desconto_tipo, desconto_valor, valor_final, prazo_extra, forma_pagamento, status, created_at, orcamentos(titulo, clientes(nome))"
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      setErro("Ordem de serviço não encontrada.");
      setCarregando(false);
      return;
    }

    setOs(data as unknown as Os);

    const { data: imgs } = await supabase
      .from("ordem_servico_imagens")
      .select("id, url, ordem")
      .eq("ordem_servico_id", id)
      .order("ordem");

    setImagens((imgs as Imagem[]) || []);
    setCarregando(false);
  }

  async function carregarEmpresa() {
    const { data } = await supabase
      .from("configuracoes")
      .select("nome_empresa, logo_url, assinatura_url")
      .maybeSingle();

    if (data) {
      setEmpresa({
        nome: data.nome_empresa || "Minha empresa",
        logo: data.logo_url || null,
        assinatura: data.assinatura_url || null,
      });
    }
  }

  async function mudarStatus(novo: string) {
    if (!os) return;
    const { error } = await supabase
      .from("ordens_servico")
      .update({ status: novo })
      .eq("id", os.id);

    if (error) {
      setErro(error.message);
      return;
    }
    setOs({ ...os, status: novo });
  }

  async function excluir() {
    if (!os) return;
    if (!confirm("Excluir esta ordem de serviço? Essa ação não pode ser desfeita.")) return;

    setExcluindo(true);
    await supabase.from("ordem_servico_imagens").delete().eq("ordem_servico_id", os.id);
    const { error } = await supabase.from("ordens_servico").delete().eq("id", os.id);

    if (error) {
      setExcluindo(false);
      setErro(error.message);
      return;
    }
    router.push("/ordens-servico/lista");
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

  if (!os) {
    return (
      <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#1A1A1A] font-medium mb-3">
            {erro || "Ordem de serviço não encontrada."}
          </p>
          <Link href="/ordens-servico/lista" className="text-sm text-[#C2410C] hover:underline">
            Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  const statusCor =
    os.status === "aprovado"
      ? "bg-green-50 text-green-700 border-green-200"
      : os.status === "recusado"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const statusRotulo =
    os.status === "aprovado"
      ? "Aprovado"
      : os.status === "recusado"
      ? "Recusado"
      : "Pendente";

  const cliente = os.orcamentos?.clientes?.nome || "Cliente";

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
          <Link href="/ordens-servico/lista" className="text-sm text-[#5A5A5A] hover:text-[#C2410C]">
            Voltar para a lista
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#C2410C] mb-1">
              OS {String(os.numero).padStart(3, "0")}/{os.ano}
            </p>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{os.titulo}</h1>
            <p className="text-sm text-[#5A5A5A]">
              {cliente} · {dataBR(os.created_at)}
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

        {os.orcamentos && (
          <p className="text-xs text-[#5A5A5A] mb-4">
            Originada do orçamento:{" "}
            <span className="text-[#1A1A1A] font-medium">{os.orcamentos.titulo}</span>
          </p>
        )}

        <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-[#1A1A1A] mb-2">O contratempo</h2>
          <p className="text-sm text-[#5A5A5A] whitespace-pre-wrap">{os.contratempo}</p>
        </section>

        <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-[#1A1A1A] mb-2">O serviço extra</h2>
          <p className="text-sm text-[#5A5A5A] whitespace-pre-wrap">{os.servico_extra}</p>
        </section>

        <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-[#1A1A1A] mb-3">Valores</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[#5A5A5A]">
              <span>Valor do serviço extra</span>
              <span>{moeda(os.valor_extra)}</span>
            </div>
            {Number(os.desconto_valor || 0) > 0 && (
              <div className="flex justify-between text-[#C2410C]">
                <span>
                  Desconto
                  {os.desconto_tipo === "percentual"
                    ? ` (${Number(os.desconto_valor)}%)`
                    : ""}
                </span>
                <span>
                  -{" "}
                  {moeda(
                    os.desconto_tipo === "percentual"
                      ? (Number(os.valor_extra) * Number(os.desconto_valor)) / 100
                      : Number(os.desconto_valor)
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[#F2EDE6]">
              <span className="text-sm text-[#5A5A5A]">Total ao cliente</span>
              <strong className="text-lg text-[#1A1A1A]">{moeda(os.valor_final)}</strong>
            </div>
          </div>
        </section>

        {(os.prazo_extra || os.forma_pagamento) && (
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">Condições</h2>
            <div className="space-y-2 text-sm">
              {os.prazo_extra && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#5A5A5A] shrink-0">Prazo extra</span>
                  <span className="text-[#1A1A1A] text-right">{os.prazo_extra}</span>
                </div>
              )}
              {os.forma_pagamento && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#5A5A5A] shrink-0">Forma de pagamento</span>
                  <span className="text-[#1A1A1A] text-right">{os.forma_pagamento}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {imagens.length > 0 && (
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5 mb-4">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">Registro fotográfico</h2>
            <div className="grid grid-cols-2 gap-3">
              {imagens.map((img) => (
                <div
                  key={img.id}
                  className="border border-[#EDE7DF] rounded-lg overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt="Foto do contratempo"
                    className="w-full aspect-square object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <BotaoPdfOs
            dados={{
              numero: os.numero,
              ano: os.ano,
              titulo: os.titulo,
              cliente,
              orcamentoTitulo: os.orcamentos?.titulo || null,
              data: dataBR(os.created_at),
              contratempo: os.contratempo,
              servicoExtra: os.servico_extra,
              valorExtra: Number(os.valor_extra),
              descontoTipo: (os.desconto_tipo as "valor" | "percentual" | null) || null,
              descontoValor: os.desconto_valor,
              valorFinal: Number(os.valor_final),
              prazoExtra: os.prazo_extra,
              formaPagamento: os.forma_pagamento,
              empresa: empresa.nome,
              logoUrl: empresa.logo,
              assinaturaUrl: empresa.assinatura,
              fotos: imagens.map((i) => i.url),
            }}
          />
          <select
            value={os.status || "pendente"}
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
            href="/ordens-servico/lista"
            className="ml-auto border border-[#D9D2C8] text-[#5A5A5A] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white transition"
          >
            Voltar
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function DetalheOs() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
          <p className="text-sm text-[#5A5A5A]">Carregando...</p>
        </div>
      }
    >
      <DetalheOsConteudo />
    </Suspense>
  );
}
