# Meu Controle Financeiro (PWA)

App de finanças pessoais. **Todos os dados ficam no seu aparelho (IndexedDB)**; o GitHub guarda apenas os arquivos do app. Sem criptografia: faça backups.

## Publicar no GitHub Pages
1. Crie uma conta em github.com e clique em **New repository** (nome: `meu-controle-financeiro`, público).
2. Envie **todo o conteúdo desta pasta** (Add file → Upload files), mantendo as subpastas `css`, `js` e `assets`. Clique em **Commit changes**.
3. Em **Settings → Pages**, em *Branch* escolha `main` e pasta `/ (root)` → **Save**.
4. Após ~1 minuto, acesse `https://SEU-USUARIO.github.io/meu-controle-financeiro/`.

## Instalar no celular
- **Android (Chrome):** menu ⋮ → *Instalar app*.
- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.
Abra uma vez com internet (carrega o OCR e os gráficos); depois funciona offline. Na primeira leitura de documento o OCR baixa o idioma português (precisa de internet).

## Usar
- **Compras → Fotografar**: confira e corrija os dados lidos, depois salve. O app compara o preço com compras anteriores do mesmo produto.
- **Contas**: fotografe a conta, confira, salve; marque como paga informando data e valor.
- OCR não é perfeito: sempre revise os campos.

## Backup
**Mais → Exportar backup (JSON)** guarda tudo, inclusive as fotos. Em outro celular: **Mais → Importar backup**. O CSV serve para planilhas.
