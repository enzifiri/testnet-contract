import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import * as fs from 'fs';
import { WarpFactory, defaultCacheOptions } from 'warp-contracts';

import { keyfile } from './constants';

/* eslint-disable no-console */
// This script will finalize the leave network protocol and remove the gateway from the registry
// The gateway's wallet owner or any other user is authorized to finalize the leave network request
(async () => {
  // load local wallet
  const wallet: JWKInterface = JSON.parse(
    process.env.JWK
      ? process.env.JWK
      : await fs.readFileSync(keyfile).toString(),
  );

  // load state of contract
  const arnsContractTxId =
    process.env.ARNS_CONTRACT_TX_ID ??
    'E-pRI1bokGWQBqHnbut9rsHSt9Ypbldos3bAtwg4JMc';

  // Initialize Arweave
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });

  const warp = WarpFactory.forMainnet(
    {
      ...defaultCacheOptions,
    },
    true,
  );

  // wallet address
  const walletAddress = await arweave.wallets.getAddress(wallet);

  // Read the ANT Registry Contract
  const pst = warp.pst(arnsContractTxId);
  pst.connect(wallet);

  const txId = await pst.writeInteraction({
    function: 'finalizeLeave',
  });

  console.log(
    `${walletAddress} successfully submitted request to finalize leaving the network with TX id: ${txId}`,
  );
})();
