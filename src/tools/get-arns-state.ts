import Arweave from "arweave";
import { LoggerFactory, WarpNodeFactory } from "warp-contracts";
import * as fs from "fs";
import { JWKInterface } from "arweave/node/lib/wallet";
import { keyfile } from "../constants";

(async () => {
  // This is the mainnet ArNS Registry Smartweave Contract TX ID
  const arnsRegistryContractTxId =
    "Ydv5pDoM6NBY1hySaWiRbe_2L3aeDDoLB7QNIu4BZpw";

  // Initialize Arweave
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  // Initialize `LoggerFactory`
  LoggerFactory.INST.logLevel("error");

  // Initialize SmartWeave
  const smartweave = WarpNodeFactory.memCached(arweave);

  // Get the key file used for the distribution
  const wallet: JWKInterface = JSON.parse(
    await fs.readFileSync(keyfile).toString()
  );

  // Read the ANT Registry Contract
  const pst = smartweave.pst(arnsRegistryContractTxId);
  pst.connect(wallet);
  const currentState = await pst.currentState();
  const currentStateString = JSON.stringify(currentState);
  const currentStateJSON = JSON.parse(currentStateString);
  console.log(currentStateJSON);
  console.log(
    "Finished set the ArNS state for the registry: %s",
    arnsRegistryContractTxId
  );
})();
