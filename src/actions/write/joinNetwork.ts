import {
  INSUFFICIENT_FUNDS_MESSAGE,
  NETWORK_JOIN_STATUS,
} from '../../constants';
import { ContractWriteResult, IOState, PstAction } from '../../types';
import { getInvalidAjvMessage } from '../../utilities';
import { validateJoinNetwork } from '../../validations';

export class JoinNetwork {
  qty: number;
  fqdn: string;
  label: string;
  note: string;
  properties: string;
  protocol: 'http' | 'https';
  port: number;
  observerWallet: string;

  constructor(input: any) {
    // validate using ajv validator
    if (!validateJoinNetwork(input)) {
      throw new ContractError(
        getInvalidAjvMessage(validateJoinNetwork, input, 'joinNetwork'),
      );
    }

    const {
      qty,
      label,
      port,
      fqdn,
      note,
      protocol,
      properties,
      observerWallet,
    } = input;
    this.qty = qty;
    this.label = label;
    this.port = port;
    this.protocol = protocol;
    this.properties = properties;
    this.fqdn = fqdn;
    this.note = note;
    this.observerWallet = observerWallet;
  }
}

// Adds a gateway into the address registry and joins it to the ar.io network
export const joinNetwork = async (
  state: IOState,
  { caller, input }: PstAction,
): Promise<ContractWriteResult> => {
  const { balances, gateways = {}, settings } = state;
  const { registry: registrySettings } = settings;

  const { qty, observerWallet, ...gatewaySettings } = new JoinNetwork(input);

  if (
    !balances[caller] ||
    balances[caller] == undefined ||
    balances[caller] == null ||
    isNaN(balances[caller])
  ) {
    throw new ContractError(`Caller balance is not defined!`);
  }

  if (balances[caller] < qty) {
    throw new ContractError(INSUFFICIENT_FUNDS_MESSAGE);
  }

  if (qty < registrySettings.minNetworkJoinStakeAmount) {
    throw new ContractError(
      `Quantity must be greater than or equal to the minimum network join stake amount ${registrySettings.minNetworkJoinStakeAmount}.`,
    );
  }

  if (caller in gateways) {
    throw new ContractError("This Gateway's wallet is already registered");
  }

  // Join the network
  state.balances[caller] -= qty;
  state.gateways[caller] = {
    operatorStake: qty,
    observerWallet: observerWallet || caller, // if no observer wallet is provided, we add the caller by default
    vaults: [],
    settings: {
      ...gatewaySettings,
    },
    status: NETWORK_JOIN_STATUS,
    start: +SmartWeave.block.height, // TODO: timestamp vs. height
    end: 0,
  };

  return { state };
};
