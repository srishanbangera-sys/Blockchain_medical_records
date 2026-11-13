const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ganache = require('ganache');
const Web3 = require('web3');

const artifact = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'build', 'contracts', 'MedicalChain.json'),
  'utf8'
));

const provider = ganache.provider({
  wallet: { deterministic: true },
  chain: { networkId: 4002, chainId: 4002 },
  logging: { quiet: true }
});
const web3 = new Web3(provider);
let accounts;

test.before(async () => {
  accounts = await web3.eth.getAccounts();
});

test.after(async () => {
  await provider.disconnect();
});

async function deploy() {
  return new web3.eth.Contract(artifact.abi)
    .deploy({ data: artifact.bytecode })
    .send({ from: accounts[0], gas: 6000000 });
}

async function expectRevert(action) {
  let reverted = false;
  try {
    await action;
  } catch (error) {
    reverted = /revert/i.test(error.message);
  }
  assert.equal(reverted, true, 'expected contract call to revert');
}

test('deploys and restricts doctor administration to the owner', async () => {
  const [admin, doctor, other] = accounts;
  const contract = await deploy();
  assert.ok(contract.options.address);

  await contract.methods.setDoctorDetails(true, doctor, 'Dr Example').send({ from: admin, gas: 6000000 });
  const details = await contract.methods.getDoctorDetails(doctor).call({ from: admin });
  assert.equal(details._state, true);
  assert.equal(details._drId, doctor);
  assert.equal(details._name, 'Dr Example');
  await expectRevert(contract.methods.setDoctorDetails(true, other, 'Not admin').send({ from: other, gas: 6000000 }));
});

test('lets registered doctors add records that patients can read', async () => {
  const [admin, doctor, patient] = accounts;
  const contract = await deploy();

  await expectRevert(contract.methods.setHealthRecordsDetails('Patient Example', patient, 'Initial note').send({ from: doctor, gas: 6000000 }));
  await contract.methods.setDoctorDetails(true, doctor, 'Dr Example').send({ from: admin, gas: 6000000 });
  await contract.methods.setHealthRecordsDetails('Patient Example', patient, 'Initial note').send({ from: doctor, gas: 6000000 });

  const patientDetails = await contract.methods.getPatientDetails(patient).call({ from: patient });
  assert.equal(patientDetails._state, true);
  assert.equal(patientDetails._paName, 'Patient Example');
  assert.equal(patientDetails._paRecords[0], 'Initial note');

  const record = await contract.methods.getHealthRecords(doctor).call({ from: patient });
  assert.equal(record._drName, 'Dr Example');
  assert.equal(record._paId, patient);
  assert.equal(record._prescription, 'Initial note');
});

test('lets patients grant and revoke doctor access', async () => {
  const [admin, doctor, patient] = accounts;
  const contract = await deploy();

  await contract.methods.setDoctorDetails(true, doctor, 'Dr Example').send({ from: admin, gas: 6000000 });
  await contract.methods.setHealthRecordsDetails('Patient Example', patient, 'Private demo note').send({ from: doctor, gas: 6000000 });

  await expectRevert(contract.methods.getHealthRecordsForDoctor(patient).call({ from: doctor }));
  await contract.methods.grantAccessToDoctor(doctor, 1).send({ from: patient, gas: 6000000 });
  const record = await contract.methods.getHealthRecordsForDoctor(patient).call({ from: doctor });
  assert.equal(record._prescription, 'Private demo note');

  await contract.methods.grantAccessToDoctor(doctor, 0).send({ from: patient, gas: 6000000 });
  await expectRevert(contract.methods.getHealthRecordsForDoctor(patient).call({ from: doctor }));
});