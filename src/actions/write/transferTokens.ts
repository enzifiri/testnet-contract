import {
  INSUFFICIENT_FUNDS_MESSAGE,
  INVALID_TARGET_MESSAGE,
} from '../../constants';
import { ContractWriteResult, IOState, PstAction } from '../../types';
import {
  getInvalidAjvMessage,
  walletHasSufficientBalance,
} from '../../utilities';
import { validateTransferToken } from '../../validations';

// TODO: use top level class
export class TransferToken {
  target: string;
  qty: number;

  constructor(input: any) {
    if (!validateTransferToken(input)) {
      throw new ContractError(
        getInvalidAjvMessage(validateTransferToken, input, 'transferToken'),
      );
    }
    const { target, qty } = input;
    this.target = target;
    this.qty = qty;
  }
}

export const transferTokens = async (
  state: IOState,
  { caller, input }: PstAction,
): Promise<ContractWriteResult> => {
  const { balances } = state;
  const { target, qty } = new TransferToken(input);

  if (caller === target) {
    throw new ContractError(INVALID_TARGET_MESSAGE);
  }

  if (
    !balances[caller] ||
    balances[caller] == undefined ||
    balances[caller] == null ||
    isNaN(balances[caller])
  ) {
    throw new ContractError(`Caller balance is not defined!`);
  }

  if (!walletHasSufficientBalance(balances, caller, qty)) {
    throw new ContractError(INSUFFICIENT_FUNDS_MESSAGE);
  }

  // deduct from caller, add to target
  if (target in balances) {
    balances[target] += qty;
  } else {
    balances[target] = qty;
  }

  balances[caller] -= qty;

  // set balances
  state.balances = balances;
  return { state };
};
