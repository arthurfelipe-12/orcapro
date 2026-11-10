"use client";

import Link from "next/link";

export default function Bloqueado() {
  return (
    <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center px-6">
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

        <Link
          href="/#preco"
          className="block w-full bg-[#C2410C] text-white text-sm font-medium py-3 rounded-lg hover:bg-[#9A3412] transition mb-3"
        >
          Ver planos e assinar
        </Link>

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
