const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractsDir = path.join(__dirname, '..', 'contracts');
const outputDir = path.join(__dirname, '..', 'build', 'contracts');
const sources = {};

for (const filename of ['MedicalChain.sol', 'Migrations.sol']) {
  sources[filename] = {
    content: fs.readFileSync(path.join(contractsDir, filename), 'utf8')
  };
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter(error => error.severity === 'error');
if (errors.length) {
  console.error(errors.map(error => error.formattedMessage).join('\n'));
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });
for (const [sourceName, contracts] of Object.entries(output.contracts || {})) {
  for (const [contractName, contract] of Object.entries(contracts)) {
    const artifact = {
      contractName,
      abi: contract.abi,
      bytecode: '0x' + contract.evm.bytecode.object,
      deployedBytecode: '0x' + contract.evm.deployedBytecode.object,
      networks: {},
      compiler: { name: 'solc', version: solc.version() },
      sourcePath: path.join(contractsDir, sourceName)
    };
    fs.writeFileSync(
      path.join(outputDir, contractName + '.json'),
      JSON.stringify(artifact, null, 2) + '\n'
    );
  }
}

console.log('Compiled MedicalChain and Migrations with ' + solc.version());