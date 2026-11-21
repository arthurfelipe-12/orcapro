"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Dados = {
  numero: number;
  ano: number;
  titulo: string;
  cliente: string;
  orcamentoTitulo: string | null;
  data: string;
  contratempo: string;
  servicoExtra: string;
  valorExtra: number;
  descontoTipo?: "valor" | "percentual" | null;
  descontoValor?: number | null;
  valorFinal: number;
  prazoExtra: string | null;
  formaPagamento: string | null;
  empresa: string;
  logoUrl: string | null;
  assinaturaUrl?: string | null;
  fotos?: string[];
};

export default function BotaoPdfOs({ dados }: { dados: Dados }) {
  const [gerando, setGerando] = useState(false);

  const moeda = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const desconto = (() => {
    const bruto = Number(dados.descontoValor || 0);
    if (!bruto || bruto <= 0) return 0;
    if (dados.descontoTipo === "percentual") {
      return Math.min((dados.valorExtra * bruto) / 100, dados.valorExtra);
    }
    return Math.min(bruto, dados.valorExtra);
  })();

  async function capturar(html: string) {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "794px";
    container.style.background = "#FFFFFF";
    container.style.padding = "48px";
    container.style.fontFamily = "Arial, Helvetica, sans-serif";
    container.style.color = "#1A1A1A";
    container.innerHTML = html;

    document.body.appendChild(container);

    try {
      await Promise.all(
        Array.from(container.querySelectorAll("img")).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve(true);
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            })
        )
      );

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        useCORS: true,
      });

      return canvas.toDataURL("image/jpeg", 0.95);
    } finally {
      document.body.removeChild(container);
    }
  }

  function alturaDaImagem(dataUrl: string): Promise<number> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const larguraMm = 210;
        resolve((img.height * larguraMm) / img.width);
      };
      img.onerror = () => resolve(297);
      img.src = dataUrl;
    });
  }

  async function gerar() {
    setGerando(true);

    try {
      const blocoTotais =
        desconto > 0
          ? `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:6px;">
              <span>Valor do serviço extra</span>
              <span>${moeda(dados.valorExtra)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#C2410C;margin-bottom:8px;">
              <span>Desconto${dados.descontoTipo === "percentual" ? ` (${Number(dados.descontoValor)}%)` : ""}</span>
              <span>- ${moeda(desconto)}</span>
            </div>
            <div style="border-top:1px solid #EDE7DF;padding-top:8px;display:flex;justify-content:space-between;font-size:15px;font-weight:bold;">
              <span>Total</span>
              <span>${moeda(dados.valorFinal)}</span>
            </div>`
          : `
            <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:bold;">
              <span>Total</span>
              <span>${moeda(dados.valorFinal)}</span>
            </div>`;

      const condicoes = [
        dados.prazoExtra
          ? `<p style="margin:0 0 6px;font-size:12px;"><strong>Prazo extra:</strong> ${dados.prazoExtra}</p>`
          : "",
        dados.formaPagamento
          ? `<p style="margin:0 0 6px;font-size:12px;"><strong>Forma de pagamento:</strong> ${dados.formaPagamento}</p>`
          : "",
      ].join("");

      const htmlOs = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #C2410C;padding-bottom:20px;margin-bottom:28px;">
          <div style="display:flex;align-items:center;gap:14px;">
            ${
              dados.logoUrl
                ? `<img src="${dados.logoUrl}" style="max-height:64px;max-width:160px;object-fit:contain;" />`
                : ""
            }
            <div>
              <p style="margin:0;font-size:18px;font-weight:bold;">${dados.empresa}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#777;">Ordem de serviço</p>
            </div>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-size:11px;color:#777;">OS ${String(dados.numero).padStart(3, "0")}/${dados.ano}</p>
            <p style="margin:2px 0 0;font-size:13px;font-weight:bold;">${dados.data}</p>
          </div>
        </div>

        <h1 style="margin:0 0 4px;font-size:20px;font-weight:bold;">${dados.titulo}</h1>
        <p style="margin:0 0 8px;font-size:13px;color:#555;">Cliente: <strong>${dados.cliente}</strong></p>
        ${
          dados.orcamentoTitulo
            ? `<p style="margin:0 0 24px;font-size:11px;color:#777;">Referente ao orçamento: ${dados.orcamentoTitulo}</p>`
            : `<div style="margin-bottom:24px;"></div>`
        }

        <div style="margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:#C2410C;">Contratempo identificado</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#333;white-space:pre-wrap;">${dados.contratempo}</p>
        </div>

        <div style="margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;color:#C2410C;">Serviço extra a executar</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#333;white-space:pre-wrap;">${dados.servicoExtra}</p>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-bottom:28px;">
          <div style="min-width:260px;background:#FDFBF8;border:1px solid #EDE7DF;border-radius:8px;padding:14px 18px;">
            ${blocoTotais}
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
            Esta ordem de serviço registra um serviço adicional não previsto no orçamento original. A aprovação pode ser feita por WhatsApp ou e-mail.
          </p>
          <div style="display:flex;gap:40px;">
            <div style="flex:1;text-align:center;">
              ${
                dados.assinaturaUrl
                  ? `<img src="${dados.assinaturaUrl}" style="max-height:52px;max-width:180px;object-fit:contain;margin:0 auto 4px;display:block;" />`
                  : `<div style="height:52px;"></div>`
              }
              <div style="border-top:1px solid #999;padding-top:6px;">
                <p style="margin:0;font-size:10px;color:#777;">${dados.empresa}</p>
              </div>
            </div>
            <div style="flex:1;text-align:center;">
              <div style="height:52px;"></div>
              <div style="border-top:1px solid #999;padding-top:6px;">
                <p style="margin:0;font-size:10px;color:#777;">${dados.cliente}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      const imgOs = await capturar(htmlOs);

      const pdf = new jsPDF("p", "mm", "a4");
      const larguraPagina = 210;
      const alturaPagina = 297;

      const alturaImgOs = await alturaDaImagem(imgOs);
      let restante = alturaImgOs;
      let posicao = 0;

      pdf.addImage(imgOs, "JPEG", 0, 0, larguraPagina, alturaImgOs);
      restante -= alturaPagina;

      while (restante > 0) {
        posicao -= alturaPagina;
        pdf.addPage();
        pdf.addImage(imgOs, "JPEG", 0, posicao, larguraPagina, alturaImgOs);
        restante -= alturaPagina;
      }

      if (dados.fotos && dados.fotos.length > 0) {
        const htmlFotos = `
          <div style="border-bottom:2px solid #C2410C;padding-bottom:14px;margin-bottom:24px;">
            <p style="margin:0;font-size:11px;color:#777;">${dados.empresa}</p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:bold;">Registro fotográfico</p>
            <p style="margin:4px 0 0;font-size:11px;color:#777;">OS ${String(dados.numero).padStart(3, "0")}/${dados.ano} · ${dados.titulo} · ${dados.cliente}</p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:16px;">
            ${dados.fotos
              .slice(0, 4)
              .map(
                (url, idx) =>
                  `<div style="width:calc(50% - 8px);">
                    <div style="width:100%;height:300px;overflow:hidden;border:1px solid #E5E5E5;border-radius:6px;">
                      <img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;" />
                    </div>
                    <p style="margin:6px 0 0;font-size:10px;color:#777;text-align:center;">Foto ${idx + 1}</p>
                  </div>`
              )
              .join("")}
          </div>
        `;

        const imgFotos = await capturar(htmlFotos);
        const alturaImgFotos = await alturaDaImagem(imgFotos);

        pdf.addPage();
        pdf.addImage(imgFotos, "JPEG", 0, 0, larguraPagina, alturaImgFotos);
      }

      const nomeArquivo = `os-${String(dados.numero).padStart(3, "0")}-${dados.ano}-${dados.cliente
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}.pdf`;

      pdf.save(nomeArquivo);
    } finally {
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
