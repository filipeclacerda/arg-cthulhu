# The Archive Remembers Tomorrow

ARG investigativo de horror cósmico apresentado como um computador Windows 98.

## Requisitos

- Node.js 20.9 ou mais recente
- npm

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Rotas públicas

- `/`: entrada direta no jogo.
- `/archive`: página de divulgação sem spoilers, para trailers, posts e press kit.
- `/play`: alias compatível da entrada do jogo.

## Verificação

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build:web
```

`npm run build:webpack` mantém uma opção de diagnóstico caso seja necessário
comparar o resultado do Turbopack com o Webpack.

## Distribuição

- `npm run build:web`: gera o build para um servidor Next.js.
- `npm run build:desktop`: exporta o jogo estático para `out/`, adequado para
  empacotamento em um shell desktop ou publicação como jogo HTML5.

O export estático desativa a otimização dinâmica de imagens e os rewrites do
PostHog, pois esses recursos dependem de um servidor Next.js.
