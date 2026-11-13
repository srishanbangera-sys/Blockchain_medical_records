
#!/bin/bash
set -e

echo "Starting Ganache..."

npm --prefix Medic@Chain run chain > /tmp/ganache.log 2>&1 &

echo "Waiting for blockchain..."

for i in {1..40}; do
  if node -e "
    fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      })
    }).then(r => r.json())
      .then(x => process.exit(x.result ? 0 : 1))
      .catch(() => process.exit(1))
  "; then
    break
  fi
  sleep 2
done

echo "Compiling MedicalChain..."

npm --prefix Medic@Chain run compile

echo "Deploying MedicalChain..."

npm --prefix Medic@Chain run migrate

echo "Starting Medic Chain website..."

cd Medic@Chain
PORT=${PORT:-10000} npm start
