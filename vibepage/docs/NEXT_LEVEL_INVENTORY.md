# Inventário — VibePage 3.0

Base selecionada: `feature/vibepage-ultimate-release`, commit `e8cb1f688224f349b7165488829d4af20e386f21`.

Branches conferidas no GitHub em 27/10/2026: `main` ainda no MVP (`080141f`); `feature/vibepage-pro-2-launch` (`40644e7`) altera somente o CTA do MVP; `fix/vibepage-launch-readiness` e `feature/vibepage-ultimate` estão contidas na release selecionada. A branch de nome Pro 2 não é mais completa que Ultimate Release. Nenhuma foi mergeada nesta tarefa.

| Área             | Já existe e será preservada                                       | Novo escopo                                                             |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Identidade       | Conta, perfil, links, uploads seguros, publicação, revisões       | Organização por layouts e blocos                                        |
| Gamers           | Cartões CRUD, seis estilos, avatares, Free 3/Pro 12               | Apenas instrumentação de cliques válidos; sem duplicar cartões          |
| Aparência        | 13 temas, presets, fontes, efeitos e fundo Pro                    | Coleções privadas de configurações e agenda sazonal                     |
| Editor           | Oito seções, prévia, ordem de links/cartões, alterações pendentes | Studio Pro com seções/colunas/larguras/visibilidade e blocos            |
| Compartilhamento | URL e imagem Open Graph                                           | QR local, VibeCard PNG e central dedicada                               |
| Estatísticas     | Views/cliques de links agregados, 7/30 dias, ranking              | Comparação, resumo semanal, cards rastreáveis e CSV                     |
| Modelos          | Presets de temas                                                  | Modelos de composição por categoria, sem artes de terceiros             |
| Produção         | Launcher, validação de ambiente, migrations e checklist           | Documentar infraestrutura ainda não disponível; nenhuma cobrança/deploy |

As implementações atuais de cartões, temas, efeitos, autenticação e segurança não serão recriadas. Novos dados usarão validação no servidor, limites e migrations aditivas. A base Free permanece funcional; downgrade preserva os novos dados privados e remove sua exibição premium pública.

## Resultado implementado

As camadas novas estão integradas às APIs e ao renderer existentes: quatro layouts, sete blocos, sete modelos de composição, dez coleções por conta Pro, cinco temporadas futuras, cinco VibeCards/QR local e analytics de 90 dias/CSV. Nenhum tema, efeito ou sistema de cartões foi recriado. Contagens de cartões são novas e separadas das estatísticas antigas.

O PR é incremental sobre `feature/vibepage-ultimate-release`, pois a `main` continua antiga. A base Ultimate Release precisa ser revisada/incorporada pelo responsável antes de levar este incremento à main. Não foi efetuado merge automático.

Migration: `202610270003_next_level`. Fontes e limites em README; evidências e limitações em VALIDATION. Recursos reais exigem o aplicativo Node/PostgreSQL; a demo local é somente visual e persistida no navegador.
