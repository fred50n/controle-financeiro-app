-- Habilite as extensões necessárias no Supabase para rodar tarefas agendadas e fazer requisições web
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Cria a rotina (Job) que vai rodar todos os dias às 11:00 UTC (Isso dá 08:00 da manhã no Horário de Brasília UTC-3)
-- Importante: 
-- 1. Substitua [SUA_URL_DO_SUPABASE] pela URL raiz da sua API do Supabase (A mesma que você usou no App).
-- 2. Substitua [SUA_CHAVE_ANON] pela sua chave ANON (A mesma que você usou no App).

SELECT cron.schedule(
  'enviar-notificacoes-diarias',
  '0 11 * * *',
  $$
  SELECT net.http_post(
      url:='[SUA_URL_DO_SUPABASE]/functions/v1/send-daily-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SUA_CHAVE_ANON]"}'::jsonb,
      body:='{}'::jsonb
  );
  $$
);

-- ==========================================================
-- COMANDOS ÚTEIS CASO PRECISE EDITAR DEPOIS
-- ==========================================================

-- Se quiser rodar agora mesmo (pra testar sem esperar 08:00 do dia seguinte), use isso (Mude pra '0 * * * *' se quiser que rode a cada minuto pra testes):
-- SELECT cron.schedule('enviar-notificacoes-diarias', '* * * * *', ...);

-- Se quiser parar a rotina no futuro, rode:
-- SELECT cron.unschedule('enviar-notificacoes-diarias');

-- Para ver se a rotina rodou com sucesso, rode:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
