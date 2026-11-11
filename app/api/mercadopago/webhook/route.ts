import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    await supabaseAdmin
      .from('assinaturas')
      .update({
        status: statusInterno,
        mercadopago_payment_id: String(paymentId),
        atualizado_em: new Date().toISOString(),
      })
      .eq('mercadopago_preference_id', pagamento.preference_id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
