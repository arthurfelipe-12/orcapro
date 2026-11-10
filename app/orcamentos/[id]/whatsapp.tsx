"use client";

type Dados = {
  cliente: string;
  titulo: string;
  valor_total: number;
  empresa: string;
  validade_dias: number | null;
  prazo_execucao: string | null;
  forma_pagamento: string | null;
};

export default function BotaoWhatsApp({ dados }: { dados: Dados }) {
  const moeda = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function enviar() {
    const linhas = [
      `Olá, ${dados.cliente}! Tudo bem?`,
      "",
      `Segue o orçamento referente a: *${dados.titulo}*`,
      "",
      `*Valor total:* ${moeda(dados.valor_total)}`,
    ];

    if (dados.prazo_execucao) {
      linhas.push(`*Prazo de execução:* ${dados.prazo_execucao}`);
    }

    if (dados.forma_pagamento) {
      linhas.push(`*Forma de pagamento:* ${dados.forma_pagamento}`);
    }

    if (dados.validade_dias) {
      linhas.push(`*Validade da proposta:* ${dados.validade_dias} dias`);
    }

    linhas.push("");
    linhas.push("Vou enviar o PDF detalhado na sequência.");
    linhas.push("");
    linhas.push("Qualquer dúvida, estou à disposição.");
    linhas.push(`— ${dados.empresa}`);

    const texto = encodeURIComponent(linhas.join("\n"));
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }

  return (
    <button
      type="button"
      onClick={enviar}
      className="bg-[#25D366] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#1EBE5A] transition"
    >
      Enviar por WhatsApp
    </button>
  );
}
