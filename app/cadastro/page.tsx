"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });

    if (error) {
      setCarregando(false);
      setErro(error.message);
      return;
    }

    if (!data.session) {
      const { error: erroLogin } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (erroLogin) {
        setCarregando(false);
        setErro(
          "Conta criada, mas o login automático falhou. Confirme o e-mail ou tente entrar."
        );
        return;
      }
    }

    setCarregando(false);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#1A1A1A]">OrçaPro</span>
        </Link>

        <div className="bg-white border border-[#EDE7DF] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Criar conta grátis</h1>
          <p className="text-sm text-[#5A5A5A] mt-2">30 dias grátis. Sem cartão de crédito.</p>

          <form onSubmit={handleCadastro} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full border border-[#D9D2C8] rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-[#D9D2C8] rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full border border-[#D9D2C8] rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#C2410C] text-white font-medium py-3 rounded-lg hover:bg-[#9A3412] transition disabled:opacity-60"
            >
              {carregando ? "Criando conta..." : "Criar conta grátis"}
            </button>
          </form>

          <p className="text-sm text-[#5A5A5A] text-center mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-[#C2410C] font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
