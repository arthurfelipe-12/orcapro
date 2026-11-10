"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Cliente = { id: string; nome: string };

type Item = {
  descricao: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
  material_incluso: boolean;
  custo_material: string;
};

const itemVazio = (): Item => ({
  descricao: "",
  quantidade: "1",
  unidade: "un",
  valor_unitario: "",
  material_incluso: true,
  custo_material: "",
});

// Converte "1.234,56" ou "1234.56" em número
function paraNumero(texto: string): number {
  if (!texto) return 0;
  const limpo = texto.replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return isNaN(n) ? 0 : n;
}

export default function NovoOrcamento() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [escopo, setEscopo] = useState("");
  const [validade, setValidade] = useState("15");

  const [custoMaoObra, setCustoMaoObra] = useState("");
  const [custoDeslocamento, setCustoDeslocamento] = useState("");
  const [custoIndireto, setCustoIndireto] = useState("");

  const [prazoExecucao, setPrazoExecucao] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [garantia, setGarantia] = useState("");

  const [itens, setItens] = useState<Item[]>([itemVazio()]);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const { data: sessao } = await supabase.auth.getSession();
    if (!sessao.session) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("clientes")
      .select("id, nome")
      .order("nome");

    setClientes(data || []);
  }

  // ---- Cálculos ----
  const totalItens = itens.reduce(
    (s, i) => s + paraNumero(i.quantidade) * paraNumero(i.valor_unitario),
    0
  );

  const custoMaterialItens = itens.reduce(
    (s, i) => s + (i.material_incluso ? paraNumero(i.custo_material) : 0),
    0
  );

  const outrosCustos =
    paraNumero(custoMaoObra) +
    paraNumero(custoDeslocamento) +
    paraNumero(custoIndireto);

  const custoTotal = custoMaterialItens + outrosCustos;

  const precoCliente = totalItens > 0 ? totalItens : custoTotal;

  const lucro = precoCliente - custoTotal;

  const margemReal = precoCliente > 0 ? (lucro / precoCliente) * 100 : 0;

  const margemBaixa = precoCliente > 0 && margemReal < 20;

  // ---- Handlers ----
  function atualizarItem(
    index: number,
    campo: keyof Item,
    valor: string | boolean
  ) {
    const novos = [...itens];
    novos[index] = { ...novos[index], [campo]: valor };
    setItens(novos);
  }

  function adicionarItem() {
    setItens([...itens, itemVazio()]);
  }

  function removerItem(index: number) {
    if (itens.length === 1) return;
    setItens(itens.filter((_, i) => i !== index));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!clienteId) {
      setErro("Selecione o cliente do orçamento.");
      return;
    }

    if (!titulo.trim()) {
      setErro("Preencha o título do orçamento.");
      return;
    }

    const itensValidos = itens.filter((i) => i.descricao.trim());

    if (itensValidos.length === 0) {
      setErro("Adicione pelo menos um item com descrição.");
      return;
    }

    const itemSemValor = itensValidos.find(
      (i) => paraNumero(i.valor_unitario) <= 0
    );
    if (itemSemValor) {
      setErro(
        `Informe o valor unitário do item "${itemSemValor.descricao.trim()}".`
      );
      return;
    }

    if (totalItens <= 0) {
      setErro("O valor total do orçamento precisa ser maior que zero.");
      return;
    }

    setSalvando(true);

    const { data: sessao } = await supabase.auth.getSession();
    const userId = sessao.session?.user.id;
    if (!userId) {
      router.push("/login");
      return;
    }

    const { data: orc, error } = await supabase
      .from("orcamentos")
      .insert({
        user_id: userId,
        cliente_id: clienteId,
        titulo: titulo.trim(),
        descricao: escopo.trim() || null,
        escopo: escopo.trim() || null,
        custo_material: Number(custoMaterialItens.toFixed(2)),
        custo_mao_obra: paraNumero(custoMaoObra),
        custo_deslocamento: paraNumero(custoDeslocamento),
        custo_indireto: paraNumero(custoIndireto),
        custo_interno: Number(custoTotal.toFixed(2)),
        margem_percentual: Number(margemReal.toFixed(2)),
        valor_total: Number(precoCliente.toFixed(2)),
        validade_dias: paraNumero(validade) || 15,
        prazo_execucao: prazoExecucao.trim() || null,
        forma_pagamento: formaPagamento.trim() || null,
        garantia: garantia.trim() || null,
      })
      .select()
      .single();

    if (error || !orc) {
      setSalvando(false);
      setErro(error?.message || "Erro ao salvar o orçamento.");
      return;
    }

    const { error: erroItens } = await supabase.from("itens_orcamento").insert(
      itensValidos.map((i, idx) => ({
        orcamento_id: orc.id,
        descricao: i.descricao.trim(),
        quantidade: paraNumero(i.quantidade),
        unidade: i.unidade.trim() || "un",
        valor_unitario: paraNumero(i.valor_unitario),
        valor_total: paraNumero(i.quantidade) * paraNumero(i.valor_unitario),
        material_incluso: i.material_incluso,
        custo_material: i.material_incluso ? paraNumero(i.custo_material) : 0,
        ordem: idx,
      }))
    );

    if (erroItens) {
      setSalvando(false);
      setErro(erroItens.message);
      return;
    }

    router.push("/orcamentos/lista");
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
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Novo orçamento</h1>
        <p className="text-sm text-[#5A5A5A] mb-6">
          Preencha de cima para baixo. O sistema calcula o lucro e a margem sozinho.
        </p>

        <form onSubmit={salvar} className="space-y-5">
          {/* 1. DADOS DO SERVIÇO */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Dados do serviço</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              Quem é o cliente e qual serviço você vai executar.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Título do orçamento *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Reforma completa do banheiro"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Um nome curto que identifique a obra. Aparece no topo do PDF.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                    Cliente *
                  </label>
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className={campo}
                  >
                    <option value="">Selecione o cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  {clientes.length === 0 ? (
                    <p className="text-xs text-[#C2410C] mt-1">
                      Nenhum cliente cadastrado.{" "}
                      <Link href="/clientes" className="underline font-medium">
                        Cadastrar cliente
                      </Link>
                    </p>
                  ) : (
                    <p className="text-xs text-[#5A5A5A] mt-1">
                      Obrigatório. O nome vai no PDF.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                    Validade da proposta (dias)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={validade}
                    onChange={(e) => setValidade(e.target.value)}
                    placeholder="15"
                    className={campo}
                  />
                  <p className="text-xs text-[#5A5A5A] mt-1">
                    Quantos dias o preço vale. O padrão é 15.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Escopo do serviço
                </label>
                <textarea
                  value={escopo}
                  onChange={(e) => setEscopo(e.target.value)}
                  rows={6}
                  placeholder={"Descreva tudo que está incluso. Ex:\n- Demolição do revestimento antigo\n- Troca da tubulação de água e esgoto\n- Impermeabilização do box\n- Assentamento de 24 m² de porcelanato\n- Instalação de louças e metais"}
                  className={`${campo} resize-none`}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Liste item por item o que está incluso. Quanto mais detalhado, menos discussão depois da entrega.
                </p>
              </div>
            </div>
          </section>

          {/* 2. ITENS */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Itens do orçamento</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              O que o cliente está pagando. O valor unitário é o preço que ele vê.
            </p>

            <div className="space-y-3">
              {itens.map((item, i) => {
                const totalItem =
                  paraNumero(item.quantidade) * paraNumero(item.valor_unitario);

                return (
                  <div key={i} className="border border-[#F2EDE6] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#5A5A5A]">
                        Item {i + 1}
                      </span>
                      {itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerItem(i)}
                          className="text-xs text-[#5A5A5A] hover:text-red-600"
                        >
                          Remover item
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                        Descrição do item
                      </label>
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => atualizarItem(i, "descricao", e.target.value)}
                        placeholder="Ex: Assentamento de porcelanato retificado"
                        className={campo}
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                          Quantidade
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.quantidade}
                          onChange={(e) => atualizarItem(i, "quantidade", e.target.value)}
                          placeholder="1"
                          className={campo}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                          Unidade
                        </label>
                        <input
                          type="text"
                          value={item.unidade}
                          onChange={(e) => atualizarItem(i, "unidade", e.target.value)}
                          placeholder="m², un, dia"
                          className={campo}
                        />
                      </div>
                      <div className="col-span-6">
                        <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                          Valor unitário (R$) *
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.valor_unitario}
                          onChange={(e) =>
                            atualizarItem(i, "valor_unitario", e.target.value)
                          }
                          placeholder="Ex: 120,00"
                          className={campo}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                          Este item inclui material?
                        </label>
                        <select
                          value={item.material_incluso ? "sim" : "nao"}
                          onChange={(e) =>
                            atualizarItem(i, "material_incluso", e.target.value === "sim")
                          }
                          className={campo}
                        >
                          <option value="sim">Sim, material incluso</option>
                          <option value="nao">Não, só mão de obra</option>
                        </select>
                      </div>

                      {item.material_incluso && (
                        <div className="col-span-6">
                          <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                            Quanto você gastou de material (R$)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.custo_material}
                            onChange={(e) =>
                              atualizarItem(i, "custo_material", e.target.value)
                            }
                            placeholder="Ex: 45,00"
                            className={campo}
                          />
                          <p className="text-xs text-[#5A5A5A] mt-1">
                            Custo interno. Não aparece no PDF.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#F2EDE6]">
                      <span className="text-xs text-[#5A5A5A]">
                        Quantidade × valor unitário
                      </span>
                      <strong className="text-sm text-[#1A1A1A]">{moeda(totalItem)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={adicionarItem}
              className="mt-3 text-sm font-medium text-[#C2410C] hover:underline"
            >
              + Adicionar outro item
            </button>

            <div className="mt-4 pt-3 border-t border-[#F2EDE6] flex justify-between text-sm">
              <span className="text-[#5A5A5A]">Soma dos itens</span>
              <strong className="text-[#1A1A1A]">{moeda(totalItens)}</strong>
            </div>
          </section>

          {/* 3. CUSTOS INTERNOS */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Custos internos</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              O que você paga e o cliente não vê. Deixe em branco se não houver.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Mão de obra (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={custoMaoObra}
                  onChange={(e) => setCustoMaoObra(e.target.value)}
                  placeholder="0,00"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Diária do ajudante, por exemplo.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Deslocamento (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={custoDeslocamento}
                  onChange={(e) => setCustoDeslocamento(e.target.value)}
                  placeholder="0,00"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Combustível, pedágio, estacionamento.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Custo indireto (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={custoIndireto}
                  onChange={(e) => setCustoIndireto(e.target.value)}
                  placeholder="0,00"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Ferramenta gasta, EPI, imposto.
                </p>
              </div>
            </div>
          </section>

          {/* 4. RESULTADO */}
          <section className="bg-white border border-[#EDE7DF] rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#C2410C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="font-semibold text-[#1A1A1A]">Resultado</h2>
            </div>
            <p className="text-xs text-[#5A5A5A] mb-4 ml-8">
              Calculado automaticamente. Confira antes de salvar.
            </p>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-[#5A5A5A]">
                <span>Material dos itens</span>
                <span>{moeda(custoMaterialItens)}</span>
              </div>
              <div className="flex justify-between text-[#5A5A5A]">
                <span>Outros custos internos</span>
                <span>{moeda(outrosCustos)}</span>
              </div>
              <div className="flex justify-between font-medium text-[#1A1A1A] pt-2 border-t border-[#F2EDE6]">
                <span>Custo total</span>
                <span>{moeda(custoTotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#1A1A1A] pt-2">
                <span>Preço ao cliente</span>
                <span>{moeda(precoCliente)}</span>
              </div>
              <div
                className={`flex justify-between font-medium pt-1 ${
                  lucro >= 0 ? "text-green-700" : "text-red-600"
                }`}
              >
                <span>Lucro real</span>
                <span>{moeda(lucro)}</span>
              </div>
              <div
                className={`flex justify-between font-medium ${
                  margemBaixa ? "text-red-600" : "text-green-700"
                }`}
              >
                <span>Margem real</span>
                <span>{margemReal.toFixed(1)}%</span>
              </div>
            </div>

            {margemBaixa && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-sm text-red-700 font-medium">
                  Margem abaixo de 20%. Revise o preço ou reduza o custo antes de enviar.
                </p>
              </div>
            )}
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
              As regras do combinado. Tudo isso aparece no PDF.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Prazo de execução
                </label>
                <input
                  type="text"
                  value={prazoExecucao}
                  onChange={(e) => setPrazoExecucao(e.target.value)}
                  placeholder="Ex: 15 dias úteis após a aprovação"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Quanto tempo leva para entregar a obra.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Forma de pagamento
                </label>
                <input
                  type="text"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  placeholder="Ex: 50% na aprovação e 50% na entrega"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Como e quando o cliente paga. Evita calote.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Garantia
                </label>
                <input
                  type="text"
                  value={garantia}
                  onChange={(e) => setGarantia(e.target.value)}
                  placeholder="Ex: 90 dias para defeitos de execução"
                  className={campo}
                />
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Prazo que você cobre defeitos do serviço.
                </p>
              </div>
            </div>
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
              {salvando ? "Salvando..." : "Salvar orçamento"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
