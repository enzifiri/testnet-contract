import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import * as fs from 'fs';
import path from 'path';

import { Foundation, IOState } from '../../src/types';
import {
  ANT_CONTRACT_IDS,
  AUCTION_SETTINGS,
  CONTRACT_SETTINGS,
  FOUNDATION_ACTION_PERIOD,
  INITIAL_STATE,
  NETWORK_HIDDEN_STATUS,
  NETWORK_JOIN_STATUS,
  NETWORK_LEAVING_STATUS,
  SECONDS_IN_A_YEAR,
  TIERS,
  WALLET_FUND_AMOUNT,
} from './constants';

// ~~ Write function responsible for adding funds to the generated wallet ~~
export async function addFunds(
  arweave: Arweave,
  wallet: JWKInterface,
  amount: number = WALLET_FUND_AMOUNT,
): Promise<boolean> {
  const walletAddress = await arweave.wallets.getAddress(wallet);
  await arweave.api.get(`/mint/${walletAddress}/${amount}`);
  return true;
}

// ~~ Write function responsible for mining block on the Arweave testnet ~~
export async function mineBlock(arweave: Arweave): Promise<boolean> {
  await arweave.api.get('mine');
  return true;
}

export async function getCurrentBlock(arweave: Arweave): Promise<number> {
  return (await arweave.blocks.getCurrent()).height;
}

export async function mineBlocks(
  arweave: Arweave,
  blocks: number,
): Promise<void> {
  for (let i = 0; i < blocks; i++) {
    await mineBlock(arweave);
  }
}

export async function createLocalWallet(
  arweave: Arweave,
): Promise<{ wallet: JWKInterface; address: string }> {
  // ~~ Generate wallet and add funds ~~
  const wallet = await arweave.wallets.generate();
  const address = await arweave.wallets.jwkToAddress(wallet);
  await addFunds(arweave, wallet);

  return {
    wallet,
    address,
  };
}

function createFees(count = 32, start = WALLET_FUND_AMOUNT) {
  const fees: any = {};
  for (let i = 1; i <= count; i++) {
    // TODO: write a better algo
    fees[i] = Math.round(start * ((count - i) / 100000));
  }
  return fees;
}

function createRecords(tiers: string[], count = 3) {
  const records: any = {};
  for (let i = 0; i < count; i++) {
    const name = `name${i + 1}`;
    const obj = {
      tier: tiers[0],
      contractTxID: ANT_CONTRACT_IDS[0],
      endTimestamp: new Date('01/01/2025').getTime() / 1000,
      startTimestamp: (Date.now() / 1000) - SECONDS_IN_A_YEAR,
    };
    records[name] = obj;
  }
  return records;
}

function createGateways(wallets: string[]) {
  // TODO write a better algo
  const gateways: any = {};
  gateways[wallets[0]] = {
    operatorStake: 50_000,
    delegatedStake: 301_000,
    start: 1,
    end: 0,
    status: NETWORK_JOIN_STATUS,
    vaults: [
      {
        balance: 40_000,
        start: 1,
        end: 0,
      },
      {
        balance: 10_000,
        start: 1,
        end: 0,
      },
    ],
    delegates: {
      [wallets[4]]: [
        {
          balance: 300_000,
          end: 5_000,
          start: 0,
        },
      ],
      [wallets[5]]: [
        {
          balance: 1_000,
          end: 2_500,
          start: 0,
        },
      ],
    },
    settings: {
      label: 'Arweave Community Gateway', // The friendly name used to label this gateway
      fqdn: 'arweave.net', // the fully qualified domain name this gateway can be reached at. eg arweave.net
      port: 443, // The port used by this gateway eg. 443
      protocol: 'https', // The protocol used by this gateway, either http or https
      openDelegation: false,
      delegateAllowList: [wallets[4], wallets[5]],
      note: 'The friendliest gateway to the whole permaweb',
    },
  };

  gateways[wallets[1]] = {
    operatorStake: 5_000, // this includes the additional vault we add below
    delegatedStake: 3_100, // this includes the additional delegate we add below
    status: NETWORK_JOIN_STATUS,
    start: 1,
    end: 0,
    vaults: [
      {
        balance: 5_000,
        start: 1,
        end: 0,
      },
    ],
    delegates: {
      [wallets[5]]: [
        {
          balance: 1_000,
          start: 1,
          end: 0,
        },
        {
          balance: 100,
          start: 1,
          end: 0,
        },
      ],
      [wallets[6]]: [
        {
          balance: 2_000,
          start: 1,
          end: 0,
        },
      ],
    },
    settings: {
      label: 'Slashme', // The friendly name used to label this gateway
      fqdn: 'slash-this-gateway.io', // the fully qualified domain name this gateway can be reached at. eg arweave.net
      port: 443, // The port used by this gateway eg. 443
      protocol: 'https', // The protocol used by this gateway, either http or https
      openDelegation: true,
      delegateAllowList: [],
      note: 'i do bad things',
    },
  };

  gateways[wallets[2]] = {
    operatorStake: 500_000, // this includes the additional vault we add below
    delegatedStake: 0, // this includes the additional delegate we add below
    status: NETWORK_JOIN_STATUS,
    start: 1,
    end: 0,
    vaults: [
      {
        balance: 250_000,
        start: 1,
        end: 0,
      },
      {
        balance: 50_000,
        start: 1,
        end: 0,
      },
      {
        balance: 100_000,
        start: 1,
        end: 0,
      },
      {
        balance: 100_000,
        start: 1,
        end: 0,
      },
    ],
    delegates: {},
    settings: {
      label: 'Delegateme', // The friendly name used to label this gateway
      fqdn: 'delegate.org', // the fully qualified domain name this gateway can be reached at. eg arweave.net
      port: 80, // The port used by this gateway eg. 443
      protocol: 'http', // The protocol used by this gateway, either http or https
      openDelegation: true,
      delegateAllowList: [],
      note: '',
    },
  };

  gateways[wallets[3]] = {
    operatorStake: 5_000, // this includes the additional vault we add below
    delegatedStake: 0, // this includes the additional delegate we add below
    status: NETWORK_HIDDEN_STATUS,
    start: 1,
    end: 0,
    vaults: [
      {
        balance: 5_000,
        start: 1,
        end: 0,
      },
    ],
    delegates: {},
    settings: {
      label: 'Wack-gateway', // The friendly name used to label this gateway
      fqdn: 'brokeninfra.net', // the fully qualified domain name this gateway can be reached at. eg arweave.net
      port: 12345, // The port used by this gateway eg. 443
      protocol: 'https', // The protocol used by this gateway, either http or https
      openDelegation: false,
      delegateAllowList: [],
      note: '',
    },
  };

  gateways[wallets[4]] = {
    operatorStake: 10_000, // this includes the additional vault we add below
    delegatedStake: 0, // this includes the additional delegate we add below
    status: NETWORK_LEAVING_STATUS,
    start: 1,
    end: 4,
    vaults: [
      {
        balance: 10_000,
        start: 1,
        end: 0,
      },
    ],
    delegates: {},
    settings: {
      label: 'See Ya Later', // The friendly name used to label this gateway
      fqdn: 'goodbye.com', // the fully qualified domain name this gateway can be reached at. eg arweave.net
      port: 443, // The port used by this gateway eg. 443
      protocol: 'https', // The protocol used by this gateway, either http or https
      openDelegation: true,
      delegateAllowList: [wallets[0]],
      note: 'Leaving the network',
    },
  };

  return gateways;
}

function createFoundation(wallets: string[]) {
  const foundation: Foundation = {
    actionPeriod: FOUNDATION_ACTION_PERIOD,
    minSignatures: 1,
    addresses: [wallets[7]],
    actions: [],
  };

  return foundation;
}

export async function setupInitialContractState(
  owner: string,
  wallets: string[],
): Promise<IOState> {
  const state: IOState = INITIAL_STATE as unknown as IOState;
  // set the tiers
  state.tiers = TIERS;

  // set the fees
  state.fees = createFees();

  // create wallets and set balances
  state.balances = wallets.reduce((current: any, wallet) => {
    current[wallet] = WALLET_FUND_AMOUNT;
    return current;
  }, {});
  // add balance to the owner
  state.balances = {
    ...state.balances,
    [owner]: WALLET_FUND_AMOUNT,
  };

  // setup auctions
  state.auctions = {};

  // create some records
  state.records = createRecords(state.tiers.current);

  // set the owner to the first wallet
  state.owner = owner;

  // configure the necessary contract settings
  state.settings = {
    registry: CONTRACT_SETTINGS,
    auctions: AUCTION_SETTINGS,
    permabuy: {
      multiplier: 100,
    },
  };

  // configure the foundation
  state.foundation = createFoundation(wallets);

  // configure some basic gateways
  state.gateways = createGateways(wallets);

  // add some reserved names
  const currentDate = new Date(); // Get current date
  const sixMonthsLater = new Date(); // Create a new date object
  const sixMonthsPrevious = new Date(); // Create a new date object
  sixMonthsLater.setMonth(currentDate.getMonth() + 6);
  sixMonthsPrevious.setMonth(currentDate.getMonth() - 6);
  state.reserved = {
    ['www']: {}, // no owner, doesnt expire
    ['google']: {
      endTimestamp: Math.floor(sixMonthsLater.getTime() / 1000),
    }, // no owner, expires in 6 months and premium
    ['twitter']: {
      target: wallets[1],
      endTimestamp: Math.floor(sixMonthsLater.getTime() / 1000),
    },
    // no owner, expires in 6 months but not premium
    ['ario']: {
      endTimestamp: Math.floor(sixMonthsLater.getTime() / 1000),
    },
  };
  return state;
}

export function getLocalWallet(index = 0): JWKInterface {
  const wallet = JSON.parse(
    fs.readFileSync(path.join(__dirname, `../wallets/${index}.json`), 'utf8'),
  ) as unknown as JWKInterface;
  return wallet;
}

export function getLocalArNSContractId(): string {
  const contract = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, `../contract/arns_contract.json`),
      'utf8',
    ),
  ) as unknown as IOState & { id: string };
  return contract.id;
}

export * from '../../src/utilities';
export * from '../../tools/utilities';
