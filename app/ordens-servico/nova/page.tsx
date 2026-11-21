"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

type Orcamento = {
  id: string;
  titulo: string;
  valor_total: number;
  clientes: { nome: string } | null;
};

function paraNumero(texto: string): number {
  if (!texto) return 0;
  const limpo = texto.replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return isNaN(n) ? 0 : n;
}

function NovaOsConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputFoto = useRef<HTMLInputElement>(null);

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [orcamentoId, setOrcamentoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [contratempo, setContratempo] = useState("");
  const [servicoExtra, setServicoExtra] = useState("");
  const [valorExtra, setValorExtra] = useState("");
  const [descontoTipo, setDescontoTipo] = useState<"valor" | "percentual">("valor");
  const [descontoValor, setDescontoValor] = useState("");
  const [prazoExtra, setPrazoExtra] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  const [fotos, setFotos] = useState<string[]>([]);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  useEffect(() => {
    carregarOrcamentos();
    const id = searchParams.get("orcamento");
    if (id) setOrcamentoId(id);
  }, []);

  async function carregarOrcamentos() {
    const { data: sessao } = await supabase.auth.getSession();
    if (!sessao.session) {
      router.push("/login");
      return;
    }
    const { data } = await supabase
      .from("orcamentos")
      .select("id, titulo, valor_total, clientes(nome)")
      .order("created_at", { ascending: false });
    setOrcamentos((data as unknown as Orcamento[]) || []);
  }

  const bruto = paraNumero(valorExtra);
  const descontoAplicado =
    descontoTipo === "percentual"
      ? Math.min((bruto * paraNumero(descontoValor)) / 100, bruto)
      : Math.min(paraNumero(descontoValor), bruto);
  const valorFinal = bruto - descontoAplicado;

  async function enviarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files || []);
    if (arquivos.length === 0) return;

    setErro("");

    if (fotos.length + arquivos.length > 4) {
      setErro("Máximo de 4 fotos por ordem de serviço.");
      return;
    }

    setEnviandoFoto(true);

    const { data: sessao } = await supabase.auth.getSession();
    const userId = sessao.session?.user.id;
    if (!userId) {
      router.push("/login");
      return;
    }

    const novas: string[] = [];

    for (const arquivo of arquivos) {
      if (!arquivo.type.startsWith("image/")) {
        setErro("Todos os arquivos precisam ser imagens.");
        setEnviandoFoto(false);
        return;
      }
      if (arquivo.size > 3 * 1024 * 1024) {
        setErro("Cada foto precisa ter no máximo 3 MB.");
        setEnviandoFoto(false);
        return;
      }

      const extensao = arquivo.name.split(".").pop() || "jpg";
      const caminho = `${userId}/os-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${extensao}`;

      const { error: erroUpload } = await supabase.storage
        .from("logos")
        .upload(caminho, arquivo, { upsert: false });

      if (erroUpload) {
        setErro(erroUpload.message);
        setEnviandoFoto(false);
        return;
      }

      const { data: publica } = supabase.storage.from("logos").getPublicUrl(caminho);
      novas.push(publica.publicUrl);
    }

    setFotos([...fotos, ...novas]);
    setEnviandoFoto(false);
    if (inputFoto.current) inputFoto.current.value = "";
  }

  function removerFoto(url: string) {
    setFotos(fotos.filter((f) => f !== url));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!titulo.trim()) {
      setErro("Preencha o título da ordem de serviço.");
      return;
    }
    if (!contratempo.trim()) {
      setErro("Descreva o contratempo que apareceu na obra.");
      return;
    }
    if (!servicoExtra.trim()) {
      setErro("Descreva o serviço extra que será executado.");
      return;
    }
    if (bruto <= 0) {
      setErro("Informe o valor extra do serviço.");
      return;
    }

    setSalvando(true);

    const { data: sessao } = await supabase.auth.getSession();
    const userId = sessao.session?.user.id;
    if (!userId) {
      router.push("/login");
      return;
    }

    const { data: numeroData, error: erroNumero } = await supabase.rpc(
      "proximo_numero_os",
      { p_user_id: userId }
    );

    if (erroNumero) {
      setSalvando(false);
      setErro(erroNumero.message);
      return;
    }

    const { data: os, error } = await supabase
      .from("ordens_servico")
      .insert({
        user_id: userId,
        orcamento_id: orcamentoId || null,
        numero: Number(numeroData) || 1,
        ano: new Date().getFullYear(),
        titulo: titulo.trim(),
        contratempo: contratempo.trim(),
        servico_extra: servicoExtra.trim(),
        valor_extra: Number(bruto.toFixed(2)),
        desconto_tipo: descontoAplicado > 0 ? descontoTipo : null,
        desconto_valor: descontoAplicado > 0 ? paraNumero(descontoValor) : 0,
        valor_final: Number(valorFinal.toFixed(2)),
        prazo_extra: prazoExtra.trim() || null,
        forma_pagamento: formaPagamento.trim() || null,
      })
      .select()
      .single();

    if (error || !os) {
      setSalvando(false);
      setErro(error?.message || "Erro ao salvar a ordem de serviço.");
      return;
    }

    if (fotos.length > 0) {
      const { error: erroFotos } = await supabase
        .from("ordem_servico_imagens")
        .insert(
          fotos.map((url, idx) => ({
            ordem_servico_id: os.id,
            url,
            ordem: idx,
          }))
        );

      if (erroFotos) {
        setSalvando(false);
        setErro(erroFotos.message);
        return;
      }
    }

    router.push("/ordens-servico/lista");
  }

  const campo =
    "w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]";
  const moeda = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
          <Link href="/dashboard" className="text-sm text-[#5A5A5A] hover:text-[#C2410C]">
            Voltar ao painel
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Nova ordem de serviço</h1>
        <p className="text-sm text-[#5A5A5A] mb-6">
          Registre o contratempo que apareceu na obra e o serviço extra que ele gerou.
        </p>

        <form onSubmit={salvar} className="space-y-5">
          {/* 1. ORIGEM */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Orçamento de origem</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              De qual obra surgiu esse contratempo. Opcional.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Orçamento
                </label>
                <select
                  value={orcamentoId}
                  onChange={(e) => setOrcamentoId(e.target.value)}
                  className={campo}
                >
                  <option value="">Sem vínculo com orçamento</option>
                  {orcamentos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titulo} — {o.clientes?.nome || "Sem cliente"} ({moeda(o.valor_total)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#5A5A5A] mt-1">
                  A OS não soma valor ao orçamento. Ela é um documento separado.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Título da OS *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Troca de tubulação não prevista no banheiro"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Um nome curto que identifique o aditivo. Aparece no topo do PDF.
                </p>
              </div>
            </div>
          </section>

          {/* 2. CONTRATEMPO */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">O contratempo</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              O que apareceu na obra e não estava previsto.
            </p>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Descreva o que aconteceu *
              </label>
              <textarea
                value={contratempo}
                onChange={(e) => setContratempo(e.target.value)}
                rows={5}
                placeholder={"Ex: Durante a demolição do revestimento, foi identificada infiltração oculta na parede hidráulica. A tubulação de ferro fundido estava oxidada em três pontos e precisou ser substituída até a coluna do prédio."}
                className={`${campo} resize-none`}
              />
              <p className="text-xs text-[#5A5A5A] mt-1">
                Quanto mais detalhado, mais fácil o cliente entender por que o serviço extra é necessário.
              </p>
            </div>
          </section>

          {/* 3. SERVIÇO EXTRA */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">O serviço extra</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              O que precisa ser feito para resolver o contratempo.
            </p>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Descreva o serviço adicional *
              </label>
              <textarea
                value={servicoExtra}
                onChange={(e) => setServicoExtra(e.target.value)}
                rows={5}
                placeholder={"Ex:\n- Quebra e remoção do piso até a coluna\n- Substituição de 6 metros de tubulação\n- Reaterro e recomposição do piso\n- Reparo da impermeabilização"}
                className={`${campo} resize-none`}
              />
              <p className="text-xs text-[#5A5A5A] mt-1">
                Liste item por item o que será executado. Isso vira o corpo do PDF.
              </p>
            </div>
          </section>

          {/* 4. VALORES */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Valores</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              Quanto custa o serviço extra. O desconto é opcional.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Valor extra (R$) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorExtra}
                  onChange={(e) => setValorExtra(e.target.value)}
                  placeholder="Ex: 1.850,00"
                  className={campo}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#1A1A1A] mb-2">Desconto</p>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <select
                      value={descontoTipo}
                      onChange={(e) =>
                        setDescontoTipo(e.target.value as "valor" | "percentual")
                      }
                      className={campo}
                    >
                      <option value="valor">Valor em R$</option>
                      <option value="percentual">Percentual %</option>
                    </select>
                  </div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={descontoValor}
                      onChange={(e) => setDescontoValor(e.target.value)}
                      placeholder={descontoTipo === "percentual" ? "Ex: 10" : "Ex: 150,00"}
                      className={campo}
                    />
                  </div>
                </div>
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Deixe vazio se não houver desconto.
                </p>
              </div>

              {bruto > 0 && (
                <div className="bg-[#FDFBF8] border border-[#EDE7DF] rounded-lg px-3 py-2 space-y-1 text-sm">
                  <div className="flex justify-between text-[#5A5A5A]">
                    <span>Valor do serviço extra</span>
                    <span>{moeda(bruto)}</span>
                  </div>
                  {descontoAplicado > 0 && (
                    <div className="flex justify-between text-[#C2410C]">
                      <span>Desconto</span>
                      <span>- {moeda(descontoAplicado)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[#1A1A1A] pt-1 border-t border-[#EDE7DF]">
                    <span>Total ao cliente</span>
                    <span>{moeda(valorFinal)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 5. CONDIÇÕES */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                5
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Condições</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              Prazo e pagamento do serviço extra.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Prazo extra
                </label>
                <input
                  type="text"
                  value={prazoExtra}
                  onChange={(e) => setPrazoExtra(e.target.value)}
                  placeholder="Ex: 4 dias úteis adicionais"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Quanto tempo a mais o serviço extra vai levar.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Forma de pagamento do valor extra
                </label>
                <input
                  type="text"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  placeholder="Ex: 50% na aprovação e 50% na entrega do serviço extra"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Como e quando o cliente paga o valor adicional.
                </p>
              </div>
            </div>
          </section>

          {/* 6. FOTOS */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                6
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Fotos do contratempo</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              Até 4 fotos. Aparecem numa página separada no PDF.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {fotos.map((url) => (
                <div
                  key={url}
                  className="relative border border-[#EDE7DF] rounded-lg overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Foto do contratempo"
                    className="w-full aspect-square object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removerFoto(url)}
                    className="absolute top-2 right-2 bg-white/90 text-xs text-[#5A5A5A] px-2 py-1 rounded hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              ))}

              {fotos.length < 4 && (
                <button
                  type="button"
                  onClick={() => inputFoto.current?.click()}
                  disabled={enviandoFoto}
                  className="aspect-square border-2 border-dashed border-[#D9D2C8] rounded-lg flex flex-col items-center justify-center hover:border-[#C2410C] transition disabled:opacity-60"
                >
                  <span className="text-2xl text-[#C2410C]">+</span>
                  <span className="text-xs text-[#5A5A5A] mt-1">
                    {enviandoFoto ? "Enviando..." : "Adicionar foto"}
                  </span>
                </button>
              )}
            </div>

            <input
              ref={inputFoto}
              type="file"
              accept="image/*"
              multiple
              onChange={enviarFoto}
              className="hidden"
            />
          </section>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {erro}
            </p>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 text-center border border-[#D9D2C8] text-[#5A5A5A] font-medium py-3 rounded-lg hover:bg-white transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-[#C2410C] text-white font-medium py-3 rounded-lg hover:bg-[#9A3412] transition disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar ordem de serviço"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NovaOs() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
          <p className="text-sm text-[#5A5A5A]">Carregando...</p>
        </div>
      }
    >
      <NovaOsConteudo />
    </Suspense>
  );
}
