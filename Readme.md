## Setup

Para rodar o projeto são necessárias duas ferramenteas instaladas, o `node.js` e `docker`.

### Node.js e Docker

```bash
# instale as dependências
yarn

# rode o docker
docker-compose up

# gere as migrations
yarn prisma:migrate

# gere os seeds para os referrals para versão de testes
yarn seed

# rode o projeto
yarn dev
```

## Rotas
