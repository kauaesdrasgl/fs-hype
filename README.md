# FS HYPE — Loja virtual

Primeira base visual do e-commerce FS HYPE, criada com Next.js, React, TypeScript e Tailwind CSS.

## Estado atual

Esta é a primeira etapa de implementação: uma interface inicial responsiva, com categorias demonstrativas, cards de produtos e carrinho local salvo no navegador.

**Ainda não é uma loja pronta para produção.** Os produtos, preços, imagens gráficas e textos são demonstrativos. O checkout do WhatsApp, banco de dados, autenticação e painel administrativo ainda precisam ser implementados.

## Requisitos

- Node.js 20.9 ou superior (o ambiente informado anteriormente tem Node.js 24.16.0)
- npm

## Executar localmente

1. Extraia a pasta `fs-hype` para `C:\Users\Folha do Acre\Documents\FS HYPE` ou para outro diretório.
2. Abra a pasta no VS Code.
3. Abra o terminal integrado e execute:

```bash
npm install
npm run dev
```

4. Acesse `http://localhost:3000`.

Para validar a compilação:

```bash
npm run build
```

## Próximas etapas

1. Executar a aplicação e corrigir eventuais incompatibilidades do ambiente.
2. Ajustar a identidade visual com os materiais oficiais do cliente.
3. Receber catálogo, fotos, preços, variações e estoque reais.
4. Configurar Supabase, migrações e políticas de acesso.
5. Implementar autenticação e painel administrativo.
6. Implementar pedidos pelo WhatsApp e validação de valores no servidor.
7. Executar testes e preparar a publicação.

## Variáveis de ambiente

O arquivo `.env.example` documenta variáveis previstas para a integração futura. Não coloque segredos no código-fonte nem compartilhe arquivos `.env` com credenciais.
