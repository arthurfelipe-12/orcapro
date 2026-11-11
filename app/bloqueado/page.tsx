"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Bloqueado() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function assinar(plano: "mensal" | "anual") {
    setErro("");
    setCarregando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const resposta = await fetch("/api/mercadopago/preferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plano }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.init_point) {
        setCarregando(false);
        setErro("Não foi possível abrir o pagamento. Tente novamente.");
        return;
      }

      window.location.href = dados.init_point;
    } catch {
      setCarregando(false);
      setErro("Não foi possível abrir o pagamento. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white border border-[#EDE7DF] rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#FDF1EB] flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-[#C2410C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">
          Seu período de teste terminou
        </h1>
        <p className="text-sm text-[#5A5A5A] mb-6 leading-relaxed">
          Os 30 dias grátis acabaram. Assine para continuar criando e enviando
          seus orçamentos.
        </p>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">
            {erro}
          </p>
        )}

        <button
          onClick={() => assinar("mensal")}
          disabled={carregando}
          className="block w-full bg-[#C2410C] text-white text-sm font-medium py-3 rounded-lg hover:bg-[#9A3412] transition mb-3 disabled:opacity-60"
        >
          {carregando ? "Abrindo pagamento..." : "Assinar mensal — R$ 49,99/mês"}
        </button>

        <button
          onClick={() => assinar("anual")}
          disabled={carregando}
          className="block w-full border border-[#C2410C] text-[#C2410C] text-sm font-medium py-3 rounded-lg hover:bg-[#FDF1EB] transition mb-3 disabled:opacity-60"
        >
          Assinar anual — R$ 499,99/ano
        </button>

        <Link
          href="/login"
          className="block w-full border border-[#D9D2C8] text-[#5A5A5A] text-sm font-medium py-3 rounded-lg hover:border-[#C2410C] hover:text-[#C2410C] transition"
        >
          Sair
        </Link>
      </div>
    </div>
  );
}
