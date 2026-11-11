import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PLANOS: Record<string, { titulo: string; valor: number }> = {
  mensal: { titulo: 'OrçaPro Digital — Mensal', valor: 49.9 },
  anual: { titulo: 'OrçaPro Digital — Anual', valor: 499.99 },
}

export async function POST(req: NextRequest) {
  try {
    const { plano } = await req.json()
    const dados = PLANOS[plano]

    if (!dados) {
      return NextResponse.json({ erro: 'Plano inválido' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ erro: 'Sessão inválida' }, { status: 401 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          id: plano,
          title: dados.titulo,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: dados.valor,
        }],
        payer: { email: user.email },
        external_reference: user.id,
        back_urls: {
          success: `${appUrl}/pagamento/sucesso`,
          failure: `${appUrl}/pagamento/falha`,
          pending: `${appUrl}/pagamento/pendente`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/mercadopago/webhook`,
        payment_methods: {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'ticket' },
            { id: 'atm' },
          ],
          excluded_payment_methods: [
            { id: 'prepaid_card' },
          ],
          installments: 1,
        },
      }),
    })

    if (!resposta.ok) {
      console.error('Mercado Pago:', await resposta.text())
      return NextResponse.json({ erro: 'Falha ao criar pagamento' }, { status: 502 })
    }

    const preferencia = await resposta.json()

    await supabaseAdmin.from('assinaturas').insert({
      user_id: user.id,
      plano,
      status: 'pendente',
      valor: dados.valor,
      mercadopago_preference_id: preferencia.id,
    })

    return NextResponse.json({ init_point: preferencia.init_point })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
