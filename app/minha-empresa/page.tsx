"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MinhaEmpresa() {
  const router = useRouter();
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

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
      .from("configuracoes")
      .select("*")
      .eq("user_id", sessao.session.user.id)
      .maybeSingle();

    if (error) {
      setErro(error.message);
    } else if (data) {
      setNomeEmpresa(data.nome_empresa || "");
      setLogoUrl(data.logo_url || "");
    }
    setCarregando(false);
  }

  async function enviarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro("");
    setSucesso("");

    if (!arquivo.type.startsWith("image/")) {
      setErro("O arquivo precisa ser uma imagem.");
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("A imagem precisa ter no máximo 2 MB.");
      return;
    }

    setEnviandoLogo(true);

    const { data: sessao } = await supabase.auth.getSession();
    const userId = sessao.session?.user.id;
    if (!userId) {
      router.push("/login");
      return;
    }

    const extensao = arquivo.name.split(".").pop() || "png";
    const caminho = `${userId}/logo.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("logos")
      .upload(caminho, arquivo, { upsert: true });

    if (erroUpload) {
      setEnviandoLogo(false);
      setErro(erroUpload.message);
      return;
    }

    const { data: publica } = supabase.storage.from("logos").getPublicUrl(caminho);
    const url = `${publica.publicUrl}?v=${Date.now()}`;

    const { error: erroSalvar } = await supabase
      .from("configuracoes")
      .upsert(
        { user_id: userId, nome_empresa: nomeEmpresa.trim() || null, logo_url: url },
        { onConflict: "user_id" }
      );

    setEnviandoLogo(false);

    if (erroSalvar) {
      setErro(erroSalvar.message);
      return;
    }

    setLogoUrl(url);
    setSucesso("Logo enviada.");
  }

  async function removerLogo() {
    setErro("");
    setSucesso("");

    const { data: sessao } = await supabase.auth.getSession();
    const userId = sessao.session?.user.id;
    if (!userId) return;

    const { error } = await supabase
      .from("configuracoes")
      .upsert(
        { user_id: userId, nome_empresa: nomeEmpresa.trim() || null, logo_url: null },
        { onConflict: "user_id" }
      );

    if (error) {
      setErro(error.message);
      return;
    }

    setLogoUrl("");
    setSucesso("Logo removida.");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    const { data: sessao } = await supabase.auth.getSession();
    const userId = sessao.session?.user.id;
    if (!userId) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("configuracoes").upsert(
      {
        user_id: userId,
        nome_empresa: nomeEmpresa.trim() || null,
        logo_url: logoUrl || null,
      },
      { onConflict: "user_id" }
    );

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso("Configurações salvas.");
  }

  const campo =
    "w-full border border-[#D9D2C8] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C2410C]";

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
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Minha empresa</h1>
        <p className="text-sm text-[#5A5A5A] mb-6">
          Esses dados aparecem no PDF do orçamento enviado ao cliente.
        </p>

        <form onSubmit={salvar} className="bg-white border border-[#EDE7DF] rounded-2xl p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Nome da empresa
            </label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              placeholder="Reformas Silva"
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Logo da empresa
            </label>

            {logoUrl ? (
              <div className="border border-[#EDE7DF] rounded-lg p-6 bg-[#FDFBF8] flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Logo da empresa"
                  className="max-h-28 max-w-full object-contain"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputArquivo.current?.click()}
                    className="text-sm text-[#C2410C] hover:underline"
                  >
                    Trocar logo
                  </button>
                  <span className="text-[#D9D2C8]">|</span>
                  <button
                    type="button"
                    onClick={removerLogo}
                    className="text-sm text-[#5A5A5A] hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputArquivo.current?.click()}
                disabled={enviandoLogo}
                className="w-full border-2 border-dashed border-[#D9D2C8] rounded-lg py-8 text-center hover:border-[#C2410C] transition disabled:opacity-60"
              >
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {enviandoLogo ? "Enviando..." : "Clique para escolher a imagem"}
                </p>
                <p className="text-xs text-[#5A5A5A] mt-1">
                  PNG, JPG ou WEBP · até 2 MB
                </p>
              </button>
            )}

            <input
              ref={inputArquivo}
              type="file"
              accept="image/*"
              onChange={enviarLogo}
              className="hidden"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {sucesso}
            </p>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-[#C2410C] text-white font-medium py-2.5 rounded-lg hover:bg-[#9A3412] transition disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </main>
    </div>
  );
}
