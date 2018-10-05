# payment-starter-kit

Simple starter kit for setting up Connext

## How to use this kit

The `master` branch contains a ready-to-go demo of the starter kit:

1. Kernel deployment script `./kernel/deploy.prod.sh`
2. Basic UI components for sending and receiving micropayments through your Hub.
3. The Connext contracts `./contracts/`
4. A connext-client that is already integrated into the UI

To fire up this branch, check out _Starting the Demo_ below.

The `tutorial` branch contains a stripped down version of the demo so that you can follow along with our [Integrating the Connext Client] tutorial.

## Starting the demo

### Starting the hub

#### Prerequisites

- [Docker](https://www.docker.com/)
- [Node.js 8+](https://nodejs.org/en/)
- [Ganache CLI](https://github.com/trufflesuite/ganache-cli)

#### Steps

- Deploy the Docker stack.

```bash
npm run hub-start
```

- Once the wake-up process completes, view the logs.

```bash
npm run logs-hub
```

```bash
npm run logs-chainsaw
```

- If you can't see logs, try the following to further debug.

```bash
docker service ps --no-trunc connext_hub
```

```bash
docker service ps --no-trunc connext_chainsaw
```

- Check that the hub is up by polling localhost:3000

```bash
curl http://localhost:3000
```

- Connect to the database to execute manual queries

```bash
npm run db
```
