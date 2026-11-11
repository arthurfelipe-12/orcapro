import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const DIAS_POR_PLANO: Record<string, number> = {
  mensal: 30,
  anual: 365,
}

export async function POST(req: NextRequest) {
  try {
    const corpo = await req.json()
    const paymentId = corpo?.data?.id

    if (corpo?.type !== 'payment' || !paymentId) {
      return NextResponse.json({ ok: true })
    }

    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    })

    if (!resposta.ok) {
      console.error('Mercado Pago:', await resposta.text())
      return NextResponse.json({ ok: false }, { status: 502 })
    }

    const pagamento = await resposta.json()
    const userId = pagamento.external_reference

    if (!userId) {
      return NextResponse.json({ ok: true })
    }

    const statusInterno =
      pagamento.status === 'approved' ? 'ativo' :
      pagamento.status === 'rejected' || pagamento.status === 'cancelled' ? 'cancelado' :
      'pendente'

    // 1. Atualiza a assinatura
    const { data: assinatura } = await supabaseAdmin
      .from('assinaturas')
      .update({
        status: statusInterno,
        mercadopago_payment_id: String(paymentId),
        atualizado_em: new Date().toISOString(),
      })
      .eq('mercadopago_preference_id', pagamento.preference_id)
      .select('plano')
      .maybeSingle()

    // 2. Se aprovado, desbloqueia o acesso estendendo o trial_ends_at
    if (statusInterno === 'ativo') {
      const plano = assinatura?.plano || 'mensal'
      const dias = DIAS_POR_PLANO[plano] ?? 30

      const { data: perfil } = await supabaseAdmin
        .from('profiles')
        .select('trial_ends_at')
        .eq('id', userId)
        .maybeSingle()

      // Se o trial já venceu, conta a partir de hoje.
      // Se ainda está válido, soma em cima da data atual de acesso.
      const base = perfil?.trial_ends_at && new Date(perfil.trial_ends_at) > new Date()
        ? new Date(perfil.trial_ends_at)
        : new Date()

      const novoVencimento = new Date(base)
      novoVencimento.setDate(novoVencimento.getDate() + dias)

      await supabaseAdmin
        .from('profiles')
        .update({ trial_ends_at: novoVencimento.toISOString() })
        .eq('id', userId)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
