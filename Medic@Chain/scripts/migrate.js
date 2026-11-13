const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

async function main() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  const accounts = await web3.eth.getAccounts();
  if (!accounts.length) {
    throw new Error('No unlocked accounts are available at ' + rpcUrl);
  }

  const artifactPath = path.join(__dirname, '..', 'build', 'contracts', 'MedicalChain.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const instance = await new web3.eth.Contract(artifact.abi)
    .deploy({ data: artifact.bytecode })
    .send({ from: accounts[0], gas: 6000000 });
  const networkId = String(await web3.eth.net.getId());

  artifact.networks[networkId] = {
    address: instance.options.address,
    transactionHash: instance.options.transactionHash
  };
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2) + '\n');
  console.log('MedicalChain deployed to ' + instance.options.address + ' on network ' + networkId);
  console.log('Demo admin account: ' + accounts[0]);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});