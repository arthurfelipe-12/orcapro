"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Os = {
  id: string;
  numero: number;
  ano: number;
  titulo: string;
  valor_final: number;
  status: string | null;
  created_at: string;
  orcamentos: { titulo: string; clientes: { nome: string } | null } | null;
};

export default function ListaOs() {
  const router = useRouter();
  const [ordens, setOrdens] = useState<Os[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: sessao } = await supabase.auth.getSession();
    if (!sessao.session) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("ordens_servico")
      .select("id, numero, ano, titulo, valor_final, status, created_at, orcamentos(titulo, clientes(nome))")
      .order("created_at", { ascending: false });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    setOrdens((data as unknown as Os[]) || []);
    setCarregando(false);
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
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Ordens de serviço</h1>
            <p className="text-sm text-[#5A5A5A]">
              Aditivos de obra: contratempos e serviços extras.
            </p>
          </div>
          <Link
            href="/ordens-servico/nova"
            className="bg-[#C2410C] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#9A3412] transition shrink-0"
          >
            + Nova OS
          </Link>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        {ordens.length === 0 ? (
          <div className="bg-white border border-[#EDE7DF] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#5A5A5A] mb-4">
              Nenhuma ordem de serviço criada ainda.
            </p>
            <Link
              href="/ordens-servico/nova"
              className="text-sm font-medium text-[#C2410C] hover:underline"
            >
              Criar a primeira ordem de serviço
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {ordens.map((os) => (
              <Link
                key={os.id}
                href={`/ordens-servico/${os.id}`}
                className="block bg-white border border-[#EDE7DF] rounded-xl p-4 hover:border-[#C2410C] transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#C2410C] mb-1">
                      OS {String(os.numero).padStart(3, "0")}/{os.ano}
                    </p>
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">
                      {os.titulo}
                    </p>
                    <p className="text-xs text-[#5A5A5A] mt-1">
                      {os.orcamentos?.clientes?.nome || "Sem cliente"} · {dataBR(os.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#1A1A1A]">
                      {moeda(os.valor_final)}
                    </p>
                    <p className="text-xs text-[#5A5A5A] mt-1">
                      {os.status === "aprovado"
                        ? "Aprovado"
                        : os.status === "recusado"
                        ? "Recusado"
                        : "Pendente"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
