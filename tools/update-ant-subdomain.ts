import { JWKInterface } from 'arweave/node/lib/wallet';
import * as fs from 'fs';
import {
  LoggerFactory,
  WarpFactory,
  defaultCacheOptions,
} from 'warp-contracts';

import { keyfile } from './constants';

(async () => {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~UPDATE THE BELOW~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // The subdomain to add or update if it already exists
  const subDomainToUpdate = 'undername';

  // The Time To Live for this ANT to reside cached, the default and minimum is 900 seconds
  const newTtlSeconds = 3600;

  // The arweave data transaction that is to be proxied using this subdomain
  const txIdToUpdate = '8p4tkaIOgbUGwuKMkjkvWe2ubXy5jGam1OCSlKTyoGc';

  // This is the Arweave Name Token Contract TX ID that will have a subdomain added/modified
  const contractTxId = 'THX7vy1LIjN6Zna1Rs1ZzQqm_xH2V0UGUA2Lckyl8gA';
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // ~~ Initialize `LoggerFactory` ~~
  LoggerFactory.INST.logLevel('error');

  // ~~ Initialize SmartWeave ~~
  const warp = WarpFactory.forMainnet(
    {
      ...defaultCacheOptions,
      inMemory: true,
    },
    true,
  );

  // Get the key file used for the distribution
  const wallet: JWKInterface = JSON.parse(fs.readFileSync(keyfile).toString());

  // ~~ Read contract source and initial state files ~~
  const pst = warp.pst(contractTxId);
  pst.connect(wallet);
  const swTxId = await pst.writeInteraction({
    function: 'setRecord',
    subDomain: subDomainToUpdate,
    ttlSeconds: newTtlSeconds,
    transactionId: txIdToUpdate,
  });

  console.log(
    `Updating ANT ${contractTxId} Subdomain "${subDomainToUpdate}" value to "${txIdToUpdate}" at txID ${swTxId}`,
  );
})();
