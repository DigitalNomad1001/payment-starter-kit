#!/usr/bin/env bash

CONTRACT_ADDRESS=0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF
ETH_NETWORK_ID=4447

repository=connextproject
project=connext
hub_image=${repository}/${project}_hub:latest
chainsaw_image=${repository}/${project}_chainsaw:latest
database_image=postgres:10
geth_image=ethereum/client-go:latest

# turn on swarm mode if it's not already on
docker swarm init 2> /dev/null

# always pull in prod mode
docker pull $database_image
docker pull $geth_image
docker pull $hub_image
docker pull $chainsaw_image

function new_secret {
    secret=$2
    if [[ -z "$secret" ]]
    then
        secret=`head -c 32 /dev/urandom | xxd -plain -c 32 | tr -d '\n\r'`
    fi
    if [[ -z "`docker secret ls -f name=$1 | grep -w $1`" ]]
    then
        id=`echo $secret | tr -d '\n\r' | docker secret create $1 -`
        echo "Created secret called $1 with id $id"
    fi
}

new_secret connext_db_dev

mkdir -p ~/ethereum

mkdir -p /tmp/$project
cat - > /tmp/$project/docker-compose.yml <<EOF
version: '3.4'

secrets:
  connext_db_dev:
    external: true

volumes:
  data:

services:
  hub:
    image: $hub_image
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - ganache
      - chainsaw
    secrets:
      - connext_db_dev
    environment:
      NODE_ENV: development
      ENV_VARS_PREFIX: /root/
      TYPEORM_HOST: postgres
      TYPEORM_PORT: 5432
      TYPEORM_DATABASE: $project
      TYPEORM_USERNAME: $project
      TYPEORM_PASSWORD_FILE: /run/secrets/connext_db_dev
      TYPEORM_LOGGING: "true"

  chainsaw:
    image: $chainsaw_image
    ports:
      - '3001:3001'
    depends_on:
      - postgres
      - geth
    secrets:
      - connext_db_dev
    environment:
      NODE_ENV: development
      ETH_NETWORK_ID: $ETH_NETWORK_ID
      ETH_NODE_PROTOCOL: http://
      ETH_NODE_HOST: host.docker.internal
      ETH_NODE_PORT: 8545
      POLLING_INTERVAL: 2000
      CONTRACT_ADDRESS: $CONTRACT_ADDRESS
      TYPEORM_HOST: postgres
      TYPEORM_PORT: 5432
      TYPEORM_DATABASE: $project
      TYPEORM_USERNAME: $project
      TYPEORM_PASSWORD_FILE: /run/secrets/connext_db_dev
      TYPEORM_LOGGING: "true"

  geth:
    image: $geth_image
    ports:
      - '8545:8545'
      - '30303:30303'
    command: ["--rinkeby", "--rpc", "--rpcaddr", "0.0.0.0"]
    volumes:
      - ~/ethereum:/root

  postgres:
    image: postgres:10
    deploy:
      mode: global
    secrets:
      - connext_db_dev
    environment:
      POSTGRES_USER: $project
      POSTGRES_DB: $project
      POSTGRES_PASSWORD_FILE: /run/secrets/connext_db_dev
    volumes:
      - data:/var/lib/postgresql/data
EOF

docker stack deploy -c /tmp/$project/docker-compose.yml $project
rm -rf /tmp/$project

echo -n "Waiting for the $project stack to wake up."
number_of_services=4
while true
do
    sleep 3
    if [[ "`docker container ls | grep $project | wc -l | sed 's/ //g'`" == "$number_of_services" ]]
    then
        echo " Good Morning!"
        break
    else
        echo -n "."
    fi
done

