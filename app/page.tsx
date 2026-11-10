import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF8] text-[#1A1A1A]">
      {/* HEADER */}
      <header className="border-b border-[#EDE7DF]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">OrçaPro</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm text-[#5A5A5A] hover:text-[#C2410C] transition">Recursos</a>
            <a href="#como-funciona" className="text-sm text-[#5A5A5A] hover:text-[#C2410C] transition">Como funciona</a>
            <a href="#preco" className="text-sm text-[#5A5A5A] hover:text-[#C2410C] transition">Preço</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#5A5A5A] hover:text-[#C2410C] transition hidden sm:block">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-[#C2410C] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#9A3412] transition">
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 border border-[#E8DCCF] bg-white text-[#C2410C] text-[11px] font-semibold tracking-widest px-3 py-1.5 rounded-full mb-7">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
            </svg>
            FEITO PARA QUEM FAZ OBRA
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.08] tracking-tight">
            Orçamento profissional em minutos.{" "}
            <span className="text-[#C2410C]">Sem caderno, sem Word.</span>
          </h1>
          <p className="text-[#5A5A5A] text-lg leading-relaxed mt-6 max-w-lg">
            O OrçaPro é o app de orçamentos para empresas de reforma que não querem perder obra por demora. Monte a proposta, controle a margem real e envie direto no WhatsApp do cliente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            <Link href="/cadastro" className="bg-[#C2410C] text-white font-medium px-7 py-3.5 rounded-lg hover:bg-[#9A3412] transition text-center">
              Começar grátis por 30 dias
            </Link>
            <Link href="/login" className="border border-[#1A1A1A] text-[#1A1A1A] font-medium px-7 py-3.5 rounded-lg hover:bg-[#1A1A1A] hover:text-white transition text-center">
              Já tenho conta
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-9 text-sm text-[#5A5A5A]">
            {["Sem cartão de crédito", "Feito para usar no celular", "PDF com sua logo"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#C2410C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Mockup do orçamento */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-[#EDE7DF] p-6 max-w-md mx-auto">
            <div className="flex items-start justify-between pb-5 border-b border-[#F0EBE4]">
              <div>
                <p className="font-semibold text-[#1A1A1A]">JR Elétrica</p>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Proposta #0042</p>
              </div>
              <span className="text-[10px] font-medium text-[#C2410C] bg-[#FDF0E8] px-2.5 py-1 rounded-full">
                Enviado
              </span>
            </div>
            <div className="py-5 border-b border-[#F0EBE4]">
              <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A] mb-1">Cliente</p>
              <p className="text-sm font-medium text-[#1A1A1A]">Marta Ribeiro</p>
              <p className="text-xs text-[#8A8A8A] mt-0.5">Rua das Acácias, 240 — Apto 71</p>
            </div>
            <div className="py-5 space-y-4">
              {[
                { nome: "Instalação de 12 pontos de tomada", qtd: "12 x R$ 95,00", valor: "R$ 1.140,00" },
                { nome: "Troca do quadro de distribuição", qtd: "1 x R$ 780,00", valor: "R$ 780,00" },
                { nome: "Passagem de infraestrutura", qtd: "45m x R$ 28,00", valor: "R$ 1.260,00" },
              ].map((item) => (
                <div key={item.nome} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-[#1A1A1A] leading-snug">{item.nome}</p>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">{item.qtd}</p>
                  </div>
                  <p className="text-sm font-medium text-[#1A1A1A] whitespace-nowrap">{item.valor}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between py-4 border-t border-[#F0EBE4]">
              <p className="text-sm text-[#5A5A5A]">Total</p>
              <p className="text-xl font-bold text-[#1A1A1A]">R$ 3.180,00</p>
            </div>
            <div className="pt-2">
              <div className="bg-[#FDFBF8] border border-[#EDE7DF] rounded-lg px-3 py-2.5 text-center">
                <p className="text-xs text-[#5A5A5A]">Proposta válida por 15 dias</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white border border-[#EDE7DF] shadow-lg rounded-full px-4 py-2 flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.5-.3z" />
              <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.3c1.4.8 3 1.3 4.7 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3C4 15 3.6 13.5 3.6 12 3.6 7.4 7.4 3.6 12 3.6S20.4 7.4 20.4 12 16.6 20.2 12 20.2z" />
            </svg>
            <span className="text-xs font-medium text-[#1A1A1A]">Enviado no WhatsApp</span>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="border-t border-[#EDE7DF] bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] font-semibold tracking-widest text-[#C2410C] mb-3">COMO FUNCIONA</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Três passos entre você e o cliente</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { n: "01", t: "Monte a proposta", d: "Adicione serviços, quantidades e materiais. O OrçaPro calcula o total na hora." },
              { n: "02", t: "Veja o lucro real", d: "Informe o custo interno e descubra a margem antes de fechar o serviço." },
              { n: "03", t: "Envie no WhatsApp", d: "Baixe o PDF com sua logo e envie com a mensagem já pronta." },
            ].map((p) => (
              <div key={p.n}>
                <p className="text-3xl font-bold text-[#E8DCCF] mb-3">{p.n}</p>
                <h3 className="text-lg font-semibold mb-2">{p.t}</h3>
                <p className="text-[#5A5A5A] text-sm leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] font-semibold tracking-widest text-[#C2410C] mb-3">RECURSOS</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">O que você resolve com o OrçaPro</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { t: "Cálculo sem erro", d: "Custo de material, mão de obra e margem calculados automaticamente. Sem conta de cabeça." },
              { t: "PDF com sua logo", d: "Proposta com a identidade do seu negócio, pronta para imprimir ou enviar." },
              { t: "Lucro visível", d: "Custo interno, lucro real e margem em cada orçamento. Alerta quando a margem está baixa." },
              { t: "Direto no WhatsApp", d: "Mensagem pronta com os dados da proposta. Você só anexa o PDF e envia." },
            ].map((r) => (
              <div key={r.t} className="bg-white border border-[#EDE7DF] rounded-xl p-7">
                <h3 className="font-semibold mb-2">{r.t}</h3>
                <p className="text-sm text-[#5A5A5A] leading-relaxed">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section id="preco" className="bg-white border-y border-[#EDE7DF] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold tracking-widest text-[#C2410C] mb-3">PREÇO</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Um preço, tudo incluído</h2>
            <p className="text-[#5A5A5A] mt-4">Comece grátis por 30 dias. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-[#EDE7DF] rounded-2xl p-8">
              <h3 className="font-semibold">Mensal</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-sm text-[#8A8A8A]">R$</span>
                <span className="text-4xl font-bold">49,99</span>
                <span className="text-sm text-[#8A8A8A] ml-1">por mês</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-[#5A5A5A]">
                {["Orçamentos ilimitados", "PDF com sua logo", "Mensagem automática no WhatsApp", "Envio por WhatsApp"].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#C2410C] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block text-center mt-8 py-3 rounded-lg border border-[#1A1A1A] font-medium hover:bg-[#1A1A1A] hover:text-white transition">
                Começar agora
              </Link>
            </div>
            <div className="border-2 border-[#C2410C] rounded-2xl p-8 relative bg-[#FDFBF8]">
              <span className="absolute -top-3 left-8 bg-[#C2410C] text-white text-[11px] font-medium px-3 py-1 rounded-full">
                Mais popular
              </span>
              <h3 className="font-semibold">Anual</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-sm text-[#8A8A8A]">R$</span>
                <span className="text-4xl font-bold">499,99</span>
                <span className="text-sm text-[#8A8A8A] ml-1">por ano</span>
              </div>
              <p className="text-sm text-[#C2410C] font-medium mt-2">Economize R$ 99,89</p>
              <ul className="mt-6 space-y-3 text-sm text-[#5A5A5A]">
                {["Tudo do plano mensal", "2 meses grátis", "Suporte prioritário", "Relatórios avançados"].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#C2410C] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block text-center mt-8 py-3 rounded-lg bg-[#C2410C] text-white font-medium hover:bg-[#9A3412] transition">
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C2410C] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-sm">OrçaPro</span>
          </div>
          <p className="text-xs text-[#8A8A8A]">© 2026 OrçaPro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
