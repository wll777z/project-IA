# PastaPronta

Renomeador de arquivos em lote, gratuito e offline, feito em Python 3.10+.

## O que faz
- Mostra uma previa antes de modificar arquivos.
- Renomeia arquivos em uma pasta com prefixo e numeracao.
- Filtra por extensao opcionalmente.
- Guarda um historico local para desfazer a ultima operacao.
- Nao precisa de bibliotecas externas nem de API paga.

## Teste no Windows (PowerShell)

```powershell
git clone https://github.com/wll777z/project-IA.git
cd project-IA
mkdir teste
"foto 1" | Set-Content "teste\primeira.txt"
"foto 2" | Set-Content "teste\segunda.txt"
python pastapronta.py teste --prefixo documento
python pastapronta.py teste --prefixo documento --aplicar
python pastapronta.py teste --desfazer
```

**Importante:** teste primeiro com copias dos arquivos. O programa nao entra em subpastas e nao apaga arquivos. Se arquivos forem modificados, movidos ou substituidos apos a renomeacao, o desfazer pode nao ser possivel. Ainda e um MVP, nao um produto pronto para venda.

## Proximos passos
1. Testes automatizados e protecao extra contra falhas.
2. Interface grafica com Tkinter.
3. Regras configuraveis e perfis salvos.
4. Entrevistas com potenciais usuarios para validar se pagariam.

## VibePage

O VibePage está na pasta [`vibepage/`](./vibepage), com editor de perfis, autenticação, temas e estatísticas.

```powershell
cd vibepage
npm ci
npm run setup
npm run dev
```

Consulte o [README do VibePage](./vibepage/README.md) e a [validação](./vibepage/VALIDATION.md). O setup requer Node.js 24 e Docker Desktop aberto. O endereço online disponível é uma demonstração; contas reais online dependem de hospedagem Node.js e PostgreSQL remoto.
