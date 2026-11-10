import { supabase } from "@/lib/supabase";

export type StatusTrial = {
  liberado: boolean;
  diasRestantes: number;
  expirado: boolean;
  trialEndsAt: string | null;
};

const DIAS_TRIAL = 30;

export async function verificarTrial(): Promise<StatusTrial> {
  const { data: sessao } = await supabase.auth.getSession();

  if (!sessao.session) {
    return { liberado: false, diasRestantes: 0, expirado: true, trialEndsAt: null };
  }

  const userId = sessao.session.user.id;

  const { data, error } = await supabase
    .from("configuracoes")
    .select("trial_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar trial:", error.message);
  }

  // Sem linha ainda: cria com 30 dias
  if (!data) {
    const fim = new Date();
    fim.setDate(fim.getDate() + DIAS_TRIAL);

    const { error: erroInsert } = await supabase
      .from("configuracoes")
      .insert({ user_id: userId, trial_ends_at: fim.toISOString() });

    if (erroInsert) {
      console.error("Erro ao criar trial:", erroInsert.message);
    }

    return {
      liberado: true,
      diasRestantes: DIAS_TRIAL,
      expirado: false,
      trialEndsAt: fim.toISOString(),
    };
  }

  // Linha existe mas sem data: concede 30 dias
  if (!data.trial_ends_at) {
    const fim = new Date();
    fim.setDate(fim.getDate() + DIAS_TRIAL);

    await supabase
      .from("configuracoes")
      .update({ trial_ends_at: fim.toISOString() })
      .eq("user_id", userId);

    return {
      liberado: true,
      diasRestantes: DIAS_TRIAL,
      expirado: false,
      trialEndsAt: fim.toISOString(),
    };
  }

  const fim = new Date(data.trial_ends_at);
  const agora = new Date();
  const diffMs = fim.getTime() - agora.getTime();

  if (diffMs <= 0) {
    return {
      liberado: false,
      diasRestantes: 0,
      expirado: true,
      trialEndsAt: data.trial_ends_at,
    };
  }

  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    liberado: true,
    diasRestantes,
    expirado: false,
    trialEndsAt: data.trial_ends_at,
  };
}
