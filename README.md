# Medic@Chain

An educational Express/EJS application backed by a Solidity smart contract. The supported setup is a **local-only development chain** using Ganache; it does not require Geth, a public RPC provider, or wallet secrets.

> **Demo and privacy warning:** this is not a production medical-record system. The contract stores patient names and prescription text in plaintext on-chain, where chain participants can read it. Login uses the demo PIN `123`, and the web app trusts local Ganache accounts. Use only fictional data on a disposable local chain. Do not deploy this app or contract to a public or real private network, and do not enter real patient information.

## Requirements

- Node.js 18 or 20 and npm
- Linux, macOS, or Windows with VS Code/terminal

Ganache and the Solidity 0.5.8 compiler are installed locally by npm. No global blockchain tools are required.

## First-time setup

Run all commands from the repository root (`Medic-Chain/`):

1. Install the root workspace and app dependencies:

   ```sh
   npm install
   ```

2. Start the local blockchain in **Terminal 1** and leave it running:

   ```sh
   npm run chain
   ```

   Ganache listens only on `127.0.0.1:8545`, uses network ID `4002`, and creates disposable funded accounts. Its first account is the demo admin. Ganache prints the test addresses in its startup output.

3. In **Terminal 2**, compile and deploy the contract:

   ```sh
   npm run compile
   npm run migrate
   ```

   Migration records the new contract address in the Truffle artifact used by the app. Run this again after restarting Ganache, because a fresh local chain has no deployed contract.

4. In **Terminal 3**, start the web app:

   ```sh
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Demo walkthrough

Use only addresses printed by the currently running Ganache instance. The demo PIN for each role is `123`.

1. Select **Admin** and sign in with Ganache account 0. Register a doctor using another Ganache account and a display name.
2. Select **Doctor** and sign in with the registered doctor address. Add a patient using a different Ganache account, a fictional name, and a fictional prescription. Adding the first record registers that patient.
3. Select **Patient** and sign in with the patient address. View the patient's record history. To authorize a doctor, enter that doctor's address and select **ALLOW**; use **REVOKE** to remove access.
4. The authorized doctor can retrieve that patient's records from the doctor portal. A doctor without consent should be denied.

## Tests

Keep the local chain from step 2 running. In another terminal, run:

```sh
npm test
```

The contract tests cover deployment, admin-only doctor registration, patient record access, and doctor-access grant/revocation.

## Troubleshooting

- **`ENOENT ... package.json`**: make sure the terminal is at the repository root, not its parent folder. This repository now has a root npm workspace manifest.
- **Port 8545 is in use**: stop the other local chain before running `npm run chain`.
- **Contract is not deployed / network 4002 error**: keep Ganache running and run `npm run migrate`; then restart `npm start`.
- **Transaction failed or account not found**: use an address from the current Ganache output. Addresses from the checked-in historical Geth data are not used by this setup.
- **Tests cannot connect**: make sure Ganache is still running at `127.0.0.1:8545`.

## Project layout

- `Medic@Chain/` — Express app, Truffle config, contract, migrations, tests, and UI
- `Medic@Chain/contracts/MedicalChain.sol` — demo contract
- `Medic@Chain/routes/index.js` — UI/API routes
- `Medic@Chain/public/` and `Medic@Chain/views/` — browser assets and EJS pages

The historical `PrivateNetwork/` directories contain old Geth chain data and key files; they are not needed for this local Ganache setup. Treat any real wallet material in those folders as compromised and never reuse it.