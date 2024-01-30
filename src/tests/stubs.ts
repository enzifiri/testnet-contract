import {
  DEFAULT_GATEWAY_PERFORMANCE_STATS,
  EPOCH_BLOCK_LENGTH,
  EPOCH_DISTRIBUTION_DELAY,
  GENESIS_FEES,
  INITIAL_DEMAND_FACTOR_DATA,
  MIN_DELEGATED_STAKE,
} from '../constants';
import {
  ArNSLeaseAuctionData,
  DelegateData,
  Delegates,
  Gateway,
  Gateways,
  IOState,
} from '../types';

export const stubbedArweaveTxId = 'thevalidtransactionidthatis43characterslong';

export const getBaselineState: () => IOState = (): IOState => ({
  ticker: 'ARNS-TEST',
  name: 'Arweave Name System Test',
  canEvolve: true,
  owner: '',
  evolve: '',
  records: {},
  balances: {},
  vaults: {},
  distributions: {
    epochZeroStartHeight: 0,
    epochStartHeight: 0,
    epochEndHeight: EPOCH_BLOCK_LENGTH - 1,
    epochDistributionHeight: EPOCH_BLOCK_LENGTH - 1 + EPOCH_DISTRIBUTION_DELAY,
  },
  reserved: {},
  fees: GENESIS_FEES,
  auctions: {},

  gateways: {},
  lastTickedHeight: 0,
  observations: {},
  demandFactoring: {
    // intentionally spread as we don't want to reference the object directly
    ...INITIAL_DEMAND_FACTOR_DATA,
  },
});

export const stubbedAuctionData: ArNSLeaseAuctionData = {
  startHeight: 1,
  startPrice: 1_000,
  endHeight: 101,
  floorPrice: 100,
  type: 'lease',
  initiator: 'initiator',
  contractTxId: 'contractTxId',
  years: 1,
};

export const stubbedAuctionState: Partial<IOState> = {
  auctions: {
    'test-auction-close': {
      ...stubbedAuctionData,
    },
  },
};

export const stubbedGatewayData: Gateway = {
  observerWallet: 'test-observer-wallet',
  delegatedStake: 0,
  start: 0,
  end: 0,
  vaults: {},
  delegates: {},
  operatorStake: 10_000,
  settings: {
    label: 'test-gateway',
    fqdn: 'test.com',
    port: 443,
    protocol: 'https',
  },
  status: 'joined',
  stats: {
    // intentionally spread as we don't want to reference the object directly
    ...DEFAULT_GATEWAY_PERFORMANCE_STATS,
  },
};

export const stubbedGateways: Gateways = {
  'a-gateway': {
    ...stubbedGatewayData,
    operatorStake: 100,
    observerWallet: 'a-gateway-observer',
  },
  'a-gateway-2': {
    ...stubbedGatewayData,
    operatorStake: 200,
    observerWallet: 'a-gateway-observer-2',
  },
  'a-gateway-3': {
    ...stubbedGatewayData,
    operatorStake: 300,
    observerWallet: 'a-gateway-observer-3',
  },
};

export const stubbedDelegateData: DelegateData = {
  delegatedStake: 100,
  start: 0,
  vaults: {},
};

export const stubbedDelegatedGatewayData: Gateway = {
  ...stubbedGatewayData,
  delegates: {
    ['delegate-1']: {
      ...stubbedDelegateData,
    },
    ['delegate-2']: {
      ...stubbedDelegateData,
    },
  },
  delegatedStake: 200,
  settings: {
    label: 'test-gateway',
    fqdn: 'test.com',
    port: 443,
    protocol: 'https',
    allowDelegatedStaking: true,
    delegateRewardShareRatio: 5,
  },
};

// Helper function to create mock delegates
export function createMockDelegates(numDelegates: number) {
  const delegates: Delegates = {};
  for (let i = 0; i < numDelegates; i++) {
    const delegateAddress = `delegateAddress${i}`; // Mock unique delegate address
    delegates[delegateAddress] = {
      delegatedStake: MIN_DELEGATED_STAKE, // or any mock value you need
      start: 0, // Mock start block
      vaults: {}, // Mock vaults data or add as needed
    };
  }
  return delegates;
}
