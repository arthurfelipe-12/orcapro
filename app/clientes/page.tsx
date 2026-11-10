"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verificarTrial } from "@/lib/trial";

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  documento: string | null;
  observacoes: string | null;
};

export default function Clientes() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [documento, setDocumento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    setCarregando(true);

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
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });

      if (error) {
        setErro(error.message);
      } else {
        setClientes(data || []);
      }
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
      setErro("Não foi possível carregar os dados. Recarregue a página.");
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setDocumento("");
    setObservacoes("");
    setEditandoId(null);
  }

  function abrirNovo() {
    limparFormulario();
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setNome(cliente.nome);
    setTelefone(cliente.telefone || "");
    setEmail(cliente.email || "");
    setEndereco(cliente.endereco || "");
    setDocumento(cliente.documento || "");
    setObservacoes(cliente.observacoes || "");
    setEditandoId(cliente.id);
    setErro("");
    setFormAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome do cliente é obrigatório.");
      return;
    }

    setSalvando(true);

    const { data: sessao } = await supabase.auth.getSession();
    const userId = sessao.session?.user.id;

    if (!userId) {
      router.push("/login");
      return;
    }

    const dados = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      endereco: endereco.trim() || null,
      documento: documento.trim() || null,
      observacoes: observacoes.trim() || null,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("clientes")
        .update(dados)
        .eq("id", editandoId);

      if (error) {
        setSalvando(false);
        setErro(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("clientes")
        .insert({ ...dados, user_id: userId });

      if (error) {
        setSalvando(false);
        setErro(error.message);
        return;
      }
    }

    setSalvando(false);
    setFormAberto(false);
    limparFormulario();
    carregarClientes();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este cliente? Os orçamentos dele ficarão sem cliente vinculado.")) {
      return;
    }

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) {
      setErro(error.message);
      return;
    }

    carregarClientes();
  }

  const filtrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone || "").includes(busca)
  );

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Clientes</h1>
            <p className="text-sm text-[#5A5A5A] mt-1">
              {clientes.length}{" "}
              {clientes.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
            </p>
          </div>
          <button
            onClick={abrirNovo}
            className="bg-[#C2410C] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#9A3412] transition"
          >
            Novo cliente
          </button>
        </div>

        {erro && !formAberto && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="w-full border border-[#D9D2C8] rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#C2410C] mb-4"
        />

        {carregando ? (
          <p className="text-sm text-[#5A5A5A]">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="bg-white border border-[#EDE7DF] rounded-2xl p-10 text-center">
            <p className="text-[#5A5A5A] text-sm">
              {clientes.length === 0
                ? "Nenhum cliente cadastrado ainda. Comece adicionando o primeiro."
                : "Nenhum cliente encontrado para essa busca."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#EDE7DF] rounded-2xl overflow-hidden">
            {filtrados.map((cliente, i) => (
              <div
                key={cliente.id}
                className={`px-5 py-4 flex items-center justify-between gap-4 ${
                  i > 0 ? "border-t border-[#F2EDE6]" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#1A1A1A] truncate">{cliente.nome}</p>
                  <p className="text-sm text-[#5A5A5A] truncate">
                    {[cliente.telefone, cliente.email].filter(Boolean).join(" · ") ||
                      "Sem contato"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => abrirEdicao(cliente)}
                    className="text-sm text-[#5A5A5A] hover:text-[#C2410C] px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => excluir(cliente.id)}
                    className="text-sm text-[#5A5A5A] hover:text-red-600 px-2 py-1"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {formAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 my-auto">
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              {editandoId ? "Editar cliente" : "Novo cliente"}
            </h2>

            <form onSubmit={salvar} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className="w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Endereço</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  className="w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C] resize-none"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {erro}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormAberto(false);
                    limparFormulario();
                    setErro("");
                  }}
                  className="flex-1 border border-[#D9D2C8] text-[#5A5A5A] font-medium py-2.5 rounded-lg hover:bg-[#FDFBF8] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-[#C2410C] text-white font-medium py-2.5 rounded-lg hover:bg-[#9A3412] transition disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
