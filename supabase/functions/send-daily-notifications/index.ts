import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configura o timezone para pegar o "hoje" correto no Brasil
function getTodayBrazilStr() {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Sao_Paulo', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  };
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

serve(async (req) => {
  try {
    // 1. Inicializa o cliente Supabase com a Service Role Key (para ignorar RLS e ler tudo com segurança)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const todayStr = getTodayBrazilStr();
    
    // 2. Buscar despesas que vencem hoje e estão pendentes
    const { data: expenses, error: expensesError } = await supabaseClient
      .from('expenses')
      .select('id, description, amount')
      .eq('status', 'pendente')
      .eq('due_date', todayStr);

    if (expensesError) throw expensesError;

    // Se não houver pendências, não manda nada.
    if (!expenses || expenses.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma despesa pendente para hoje." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Montar a mensagem totalizando o valor e o número de contas
    const totalAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const message = {
      title: "Contas Vencendo Hoje! 🚨",
      body: `Você tem ${expenses.length} despesa(s) pendente(s) totalizando R$ ${totalAmount.toFixed(2)}.`,
      data: { route: "index" }, // Para um futuro deep-linking
    };

    // 4. Pegar os tokens de todos os celulares logados no app
    const { data: tokensData, error: tokensError } = await supabaseClient
      .from('device_tokens')
      .select('token');

    if (tokensError) throw tokensError;

    if (!tokensData || tokensData.length === 0) {
      return new Response(JSON.stringify({ message: "Despesas encontradas, mas nenhum celular (token) cadastrado." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 5. Disparar Notificações via Expo Push API
    const pushMessages = tokensData.map((t) => ({
      to: t.token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data,
    }));

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessages),
    });

    const expoResult = await expoResponse.json();

    return new Response(
      JSON.stringify({ message: "Notificações enviadas com sucesso!", result: expoResult }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
