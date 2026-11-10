"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Item = {
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
};

type Dados = {
  titulo: string;
  cliente: string;
  data: string;
  escopo: string | null;
  valor_total: number;
  validade_dias: number | null;
  prazo_execucao: string | null;
  forma_pagamento: string | null;
  garantia: string | null;
  empresa: string;
  logoUrl: string | null;
  itens: Item[];
};

export default function BotaoPdf({ dados }: { dados: Dados }) {
  const [gerando, setGerando] = useState(false);

  const moeda = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function gerar() {
    setGerando(true);

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "794px";
    container.style.background = "#FFFFFF";
    container.style.padding = "48px";
    container.style.fontFamily = "Arial, Helvetica, sans-serif";
    container.style.color = "#1A1A1A";

    const linhasItens = dados.itens
      .map(
        (i) => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #E5E5E5;font-size:12px;">${i.descricao}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #E5E5E5;font-size:12px;text-align:center;">${Number(
            i.quantidade
          )} ${i.unidade}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #E5E5E5;font-size:12px;text-align:right;">${moeda(
            i.valor_unitario
          )}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #E5E5E5;font-size:12px;text-align:right;font-weight:bold;">${moeda(
            i.valor_total
          )}</td>
        </tr>`
      )
      .join("");

    const condicoes = [
      dados.validade_dias
        ? `<p style="margin:0 0 6px;font-size:12px;"><strong>Validade da proposta:</strong> ${dados.validade_dias} dias</p>`
        : "",
      dados.prazo_execucao
        ? `<p style="margin:0 0 6px;font-size:12px;"><strong>Prazo de execução:</strong> ${dados.prazo_execucao}</p>`
        : "",
      dados.forma_pagamento
        ? `<p style="margin:0 0 6px;font-size:12px;"><strong>Forma de pagamento:</strong> ${dados.forma_pagamento}</p>`
        : "",
      dados.garantia
        ? `<p style="margin:0 0 6px;font-size:12px;"><strong>Garantia:</strong> ${dados.garantia}</p>`
        : "",
    ].join("");

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #C2410C;padding-bottom:20px;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${
            dados.logoUrl
              ? `<img src="${dados.logoUrl}" style="max-height:64px;max-width:160px;object-fit:contain;" />`
              : ""
          }
          <div>
            <p style="margin:0;font-size:18px;font-weight:bold;">${dados.empresa}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#777;">Orçamento de serviço</p>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:11px;color:#777;">Data</p>
          <p style="margin:2px 0 0;font-size:13px;font-weight:bold;">${dados.data}</p>
        </div>
      </div>

      <h1 style="margin:0 0 4px;font-size:20px;font-weight:bold;">${dados.titulo}</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#555;">Cliente: <strong>${dados.cliente}</strong></p>

      ${
        dados.escopo
          ? `<div style="margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:#C2410C;">Escopo do serviço</p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#333;white-space:pre-wrap;">${dados.escopo}</p>
            </div>`
          : ""
      }

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#FDFBF8;">
            <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#777;border-bottom:1px solid #E5E5E5;">Descrição</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#777;border-bottom:1px solid #E5E5E5;">Qtd</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#777;border-bottom:1px solid #E5E5E5;">Valor un.</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#777;border-bottom:1px solid #E5E5E5;">Total</th>
          </tr>
        </thead>
        <tbody>${linhasItens}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:28px;">
        <div style="min-width:240px;background:#FDFBF8;border:1px solid #EDE7DF;border-radius:8px;padding:14px 18px;">
          <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:bold;">
            <span>Total</span>
            <span>${moeda(dados.valor_total)}</span>
          </div>
        </div>
      </div>

      ${
        condicoes
          ? `<div style="margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:#C2410C;">Condições</p>
              ${condicoes}
            </div>`
          : ""
      }

      <div style="border-top:1px solid #E5E5E5;padding-top:16px;margin-top:32px;">
        <p style="margin:0 0 28px;font-size:11px;color:#777;line-height:1.5;">
          Este orçamento é válido conforme o prazo indicado acima. A aprovação pode ser feita por WhatsApp ou e-mail.
        </p>
        <div style="display:flex;gap:40px;">
          <div style="flex:1;border-top:1px solid #999;padding-top:6px;">
            <p style="margin:0;font-size:10px;color:#777;">${dados.empresa}</p>
          </div>
          <div style="flex:1;border-top:1px solid #999;padding-top:6px;">
            <p style="margin:0;font-size:10px;color:#777;">${dados.cliente}</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
      });

      const img = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");

      const larguraPagina = 210;
      const alturaPagina = 297;
      const larguraImg = larguraPagina;
      const alturaImg = (canvas.height * larguraImg) / canvas.width;

      let alturaRestante = alturaImg;
      let posicao = 0;

      pdf.addImage(img, "JPEG", 0, 0, larguraImg, alturaImg);
      alturaRestante -= alturaPagina;

      while (alturaRestante > 0) {
        posicao -= alturaPagina;
        pdf.addPage();
        pdf.addImage(img, "JPEG", 0, posicao, larguraImg, alturaImg);
        alturaRestante -= alturaPagina;
      }

      const nomeArquivo = `orcamento-${dados.cliente
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}.pdf`;

      pdf.save(nomeArquivo);
    } finally {
      document.body.removeChild(container);
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={gerar}
      disabled={gerando}
      className="bg-[#C2410C] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#9A3412] transition disabled:opacity-60"
    >
      {gerando ? "Gerando PDF..." : "Baixar PDF"}
    </button>
  );
}
