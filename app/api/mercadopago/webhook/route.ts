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

    // 1. Atualiza a assinatura pelo user_id (mais confiável que preference_id)
    const { data: assinatura } = await supabaseAdmin
      .from('assinaturas')
      .update({
        status: statusInterno,
        mercadopago_payment_id: String(paymentId),
        atualizado_em: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('plano')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 2. Se aprovado, desbloqueia o acesso estendendo o trial_ends_at
    if (statusInterno === 'ativo') {
      const plano = assinatura?.plano || 'mensal'
      const dias = DIAS_POR_PLANO[plano] ?? 30

      const { data: config } = await supabaseAdmin
        .from('configuracoes')
        .select('trial_ends_at, ultimo_payment_id')
        .eq('user_id', userId)
        .maybeSingle()

      // Evita somar dias repetidos quando o Mercado Pago reenvia a notificação
      if (config?.ultimo_payment_id === String(paymentId)) {
        return NextResponse.json({ ok: true, ignorado: true })
      }

      // Se o trial já venceu, conta a partir de hoje.
      // Se ainda está válido, soma em cima da data atual de acesso.
      const base = config?.trial_ends_at && new Date(config.trial_ends_at) > new Date()
        ? new Date(config.trial_ends_at)
        : new Date()

      const novoVencimento = new Date(base)
      novoVencimento.setDate(novoVencimento.getDate() + dias)

      if (config) {
        await supabaseAdmin
          .from('configuracoes')
          .update({
            trial_ends_at: novoVencimento.toISOString(),
            ultimo_payment_id: String(paymentId),
          })
          .eq('user_id', userId)
      } else {
        await supabaseAdmin
          .from('configuracoes')
          .insert({
            user_id: userId,
            trial_ends_at: novoVencimento.toISOString(),
            ultimo_payment_id: String(paymentId),
          })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
