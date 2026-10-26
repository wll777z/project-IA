# StudioPilot AI v0.1

Protótipo de chat no navegador conectado ao Roblox Studio, gratuito e offline, sem dependências Python externas.

**Atenção:** esta versão é uma ponte de mensagens, não tem geração de código por IA e não altera jogos.

## Instalação

1. No VS Code, abra a pasta do repositório.
2. No terminal, execute `python -m studiopilot.server`.
3. Abra `http://127.0.0.1:8765` no navegador e cole o token exibido no terminal.
4. No Roblox Studio, crie um Script temporário em ServerStorage, cole o conteúdo de `roblox/StudioPilot.plugin.lua` e use **Plugins → Save as Local Plugin**.
5. Apague o Script temporário do projeto. Abra o plugin StudioPilot pela barra de plugins.
6. Cole o mesmo token no plugin e clique **Conectar**.
7. Se o Studio pedir permissão para acesso a `127.0.0.1:8765`, autorize somente se reconhecer seu servidor local.
8. Envie uma mensagem no navegador e veja o painel e o Output do Studio.

## Testes

```powershell
python -m unittest discover -s tests -v
```

## Segurança

Servidor ligado apenas em 127.0.0.1, token aleatório a cada inicialização, validação de Host e Origin, limite de mensagens, sem execução de código remoto. Não exponha a porta na internet. Não compartilhe o token.

## Próximos passos

Adicionar confirmação de ações, operações permitidas e reversíveis, testes no Roblox Studio e IA opcional. Esta versão ainda não foi validada no Roblox Studio real.

Documentação Roblox: https://create.roblox.com/docs/studio/plugins e https://create.roblox.com/docs/cloud-services/http-service
