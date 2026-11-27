# ServiLink

Marketplace moçambicano: **Serviços Digitais** e **Técnico ao Domicílio**. Contacto só por WhatsApp, sem comissão.
Next.js 14 (App Router) + Supabase + Tailwind. Desenvolvido por ALTIS - Soluções Tecnológicas.

## 1. Base de dados (Supabase) — ordem
**Base nova (ou só de testes):**
1. `supabase/00-limpar-tudo.sql` (APAGA tudo) → 2. `supabase/schema.sql` → 3. `supabase/migracao-v3.sql`.

**Base que já tens (não perde dados):** corre só `supabase/migracao-v3.sql` (pode correr mais de uma vez).

Depois:
- Authentication → Providers → Email: **desliga "Allow new users to sign up"**.
- **Admin:** Authentication → Users → *Add user* (email + senha forte, auto confirm). Copia o UUID e corre:
  ```sql
  insert into public.users (id, role, status, nome, admin_code)
  values ('UUID-AQUI', 'admin', 'aprovado', 'Admin ServiLink', 'SL-Admin-9136')
  on conflict (id) do update set admin_code = 'SL-Admin-9136';
  ```
  (se o admin já existe: `update public.users set admin_code = 'SL-Admin-9136' where id = 'UUID';`)
  Entra em `/entrar` com **Código Admin + palavra-passe** (o código nunca substitui a palavra-passe). Escolhe o teu próprio código.
- Gera uma chave `service_role` nova (a antiga foi exposta). Só vai na Vercel.

## 2. Variáveis de ambiente
Copia `.env.example` (Vercel → Settings → Environment Variables, ou `.env.local`). `DADOS_CHAVE` é obrigatória e deve ser guardada.

## 3. SkyWallet (pagamento M-Pesa do plano PRO)
1. No Developer Portal da SkyWallet obtém `SK_ID`, `API_KEY` e `WEBHOOK_SECRET` e preenche `SKYWALLET_SK_ID`, `SKYWALLET_API_KEY`, `SKYWALLET_WEBHOOK_SECRET`.
2. Regista no portal o webhook: `https://SEU-SITE/api/webhooks/skywallet`.
3. Preço e duração: tabela `planos` (PRO = 599 MT / 90 dias). O admin altera o preço em **Admin → Plano PRO**, sem tocar no código.
4. Para mostrar os planos no site: `lib/config.ts` → `PLANOS_VISIVEIS = true`. Sem credenciais o pagamento fica indisponível (nada é cobrado nem simulado).
5. Primeiro teste: faz uma compra com um valor real baixo (altera o preço para 1 MT temporariamente), confirma no M-Pesa e verifica em Admin → Pagamentos.
- O PRO só ativa depois de confirmação autêntica: webhook com assinatura HMAC-SHA256 válida ou consulta autenticada ao estado. Cliques, redirecionamentos ou o navegador nunca ativam o PRO.
- Rotas: `POST /api/webhooks/skywallet`, `GET /api/payments/skywallet/status?order_id=...` (só o dono). O pedido de pagamento é a *server action* `pagarPlano` (`app/planos/actions.ts`).
- **Verificar com a SkyWallet:** o formato exato da resposta do pedido e a serialização da assinatura seguem a documentação enviada, mas não foram testados contra a API real.

## 4. Correr
```bash
npm install next@14 && npm audit
npm run build && npm start
```

## 5. Backup diário
`.github/workflows/backup.yml` (`pg_dump`). Secret `DATABASE_URL` no GitHub. Ativa também os backups do Supabase.

## 6. Cron
`vercel.json` corre `/api/cron/manutencao` 1x/dia (plano Hobby). Define `CRON_SECRET`.

## 7. Testes de segurança antes de publicar
- Sem login: `/admin`, `/painel`, `/api/payments/skywallet/status` não dão acesso.
- Cliente/profissional não entram em `/admin`; código Admin com palavra-passe errada → erro genérico e bloqueio após 5 falhas.
- Webhook com assinatura errada → 401 e nada muda. Webhook repetido → um só PRO.
- Mesmo WhatsApp duas vezes como profissional → recusado. Upload que não é imagem → recusado.

## Notas
- Recuperação de senha: o admin gera uma senha temporária; suporte no WhatsApp +258 83 550 4135.
- Cidades/bairros: `lib/localidades.ts` (lista editável).
- Métricas: Admin → Resumo (últimos 30 dias, sem dados pessoais).
