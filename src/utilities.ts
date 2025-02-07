import {
  ARNS_NAME_RESERVED_MESSAGE,
  INVALID_INPUT_MESSAGE,
  INVALID_SHORT_NAME,
  MAX_YEARS,
  MINIMUM_ALLOWED_NAME_LENGTH,
  NAMESPACE_LENGTH,
  NON_EXPIRED_ARNS_NAME_MESSAGE,
  SECONDS_IN_A_YEAR,
  SECONDS_IN_GRACE_PERIOD,
  SHORT_NAME_RESERVATION_UNLOCK_TIMESTAMP,
} from './constants';
import {
  ArNSNameData,
  AuctionData,
  Balances,
  BlockHeight,
  BlockTimestamp,
  DeepReadonly,
  Gateway,
  GatewayRegistrySettings,
  IOToken,
  Records,
  RegistrationType,
  ReservedNameData,
  ReservedNames,
} from './types';

// check if a string is a valid fully qualified domain name
export function isValidFQDN(fqdn: string): boolean {
  const fqdnRegex = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{1,63}$/;
  return fqdnRegex.test(fqdn);
}

// check if it is a valid arweave base64url for a wallet public address, transaction id or smartweave contract
export function isValidArweaveBase64URL(base64URL: string): boolean {
  const base64URLRegex = new RegExp('^[a-zA-Z0-9_-]{43}$');
  return base64URLRegex.test(base64URL);
}

export function walletHasSufficientBalance(
  balances: DeepReadonly<Balances>,
  wallet: string,
  qty: number,
): boolean {
  return !!balances[wallet] && balances[wallet] >= qty;
}

export function calculateUndernamePermutations(domain: string): number {
  const numberOfPossibleCharacters = 38; // 26 letters + 10 numbers + - (dash) + _ (underscore)
  const numberOfAllowedStartingAndEndingCharacters = 36; // 26 letters + 10 numbers
  const nameSpaceLength = NAMESPACE_LENGTH - domain.length; // should be between 11 and 61
  let numberOfPossibleUndernames = 0;

  for (
    let undernameLength = 1;
    undernameLength <= nameSpaceLength;
    undernameLength++
  ) {
    if (undernameLength === 1 || undernameLength === nameSpaceLength) {
      numberOfPossibleUndernames +=
        numberOfAllowedStartingAndEndingCharacters ** undernameLength;
    } else {
      numberOfPossibleUndernames +=
        numberOfPossibleCharacters ** undernameLength;
    }
  }
  return numberOfPossibleUndernames;
}

export function isNameInGracePeriod({
  currentBlockTimestamp,
  record,
}: {
  currentBlockTimestamp: BlockTimestamp;
  record: ArNSNameData;
}): boolean {
  if (!record.endTimestamp) return false;
  const recordIsExpired = currentBlockTimestamp.valueOf() > record.endTimestamp;
  return (
    recordIsExpired &&
    record.endTimestamp + SECONDS_IN_GRACE_PERIOD >
      currentBlockTimestamp.valueOf()
  );
}

export function getMaxAllowedYearsExtensionForRecord({
  currentBlockTimestamp,
  record,
}: {
  currentBlockTimestamp: BlockTimestamp;
  record: ArNSNameData;
}): number {
  if (!record.endTimestamp) {
    return 0;
  }
  // if expired return 0 because it cannot be extended and must be re-bought
  if (
    currentBlockTimestamp.valueOf() >
    record.endTimestamp + SECONDS_IN_GRACE_PERIOD
  ) {
    return 0;
  }

  if (isNameInGracePeriod({ currentBlockTimestamp, record })) {
    return MAX_YEARS;
  }

  // TODO: should we put this as the ceiling? or should we allow people to extend as soon as it is purchased
  const yearsRemainingOnLease = Math.ceil(
    (record.endTimestamp.valueOf() - currentBlockTimestamp.valueOf()) /
      SECONDS_IN_A_YEAR,
  );

  // a number between 0 and 5 (MAX_YEARS)
  return MAX_YEARS - yearsRemainingOnLease;
}

export function getInvalidAjvMessage(
  validator: any,
  input: any,
  functionName: string,
): string {
  return `${INVALID_INPUT_MESSAGE} for ${functionName}: ${validator.errors
    .map((e: any) => {
      const key = e.instancePath.replace('/', '');
      const value = input[key];
      return `${key} ('${value}') ${e.message}`;
    })
    .join(', ')}`;
}

export function isExistingActiveRecord({
  record,
  currentBlockTimestamp,
}: {
  record: ArNSNameData;
  currentBlockTimestamp: BlockTimestamp;
}): boolean {
  return (
    record &&
    record.endTimestamp &&
    record.endTimestamp + SECONDS_IN_GRACE_PERIOD >
      currentBlockTimestamp.valueOf()
  );
}

export function isShortNameRestricted({
  name,
  currentBlockTimestamp,
}: {
  name: string;
  currentBlockTimestamp: BlockTimestamp;
}): boolean {
  return (
    name.length < MINIMUM_ALLOWED_NAME_LENGTH &&
    currentBlockTimestamp.valueOf() < SHORT_NAME_RESERVATION_UNLOCK_TIMESTAMP
  );
}

export function isActiveReservedName({
  caller,
  reservedName,
  currentBlockTimestamp,
}: {
  caller: string | undefined;
  reservedName: ReservedNameData | undefined;
  currentBlockTimestamp: BlockTimestamp;
}): boolean {
  if (!reservedName) return false;
  const target = reservedName.target;
  const endTimestamp = reservedName.endTimestamp;
  const permanentlyReserved = !target && !endTimestamp;
  const callerNotTarget = !caller || target !== caller;
  const notExpired =
    endTimestamp && endTimestamp > currentBlockTimestamp.valueOf();
  if (permanentlyReserved || (callerNotTarget && notExpired)) {
    return true;
  }
  return false;
}

export function isNameAvailableForAuction({
  name,
  record,
  reservedName,
  caller,
  currentBlockTimestamp,
}: {
  name: string;
  record: ArNSNameData | undefined;
  caller: string;
  reservedName: ReservedNameData | undefined;
  currentBlockTimestamp: BlockTimestamp;
}): boolean {
  return (
    !isExistingActiveRecord({ record, currentBlockTimestamp }) &&
    !isActiveReservedName({ reservedName, caller, currentBlockTimestamp }) &&
    !isShortNameRestricted({ name, currentBlockTimestamp })
  );
}

export function isNameRequiredToBeAuction({
  name,
  type,
}: {
  name: string;
  type: RegistrationType;
}): boolean {
  return type === 'permabuy' && name.length < 12;
}

export function assertAvailableRecord({
  caller,
  name,
  records,
  reserved,
  currentBlockTimestamp,
}: {
  caller: string | undefined; // TODO: type for this
  name: DeepReadonly<string>;
  records: DeepReadonly<Records>;
  reserved: DeepReadonly<ReservedNames>;
  currentBlockTimestamp: BlockTimestamp;
}): void {
  if (
    isExistingActiveRecord({
      record: records[name],
      currentBlockTimestamp,
    })
  ) {
    throw new ContractError(NON_EXPIRED_ARNS_NAME_MESSAGE);
  }
  if (
    isActiveReservedName({
      caller,
      reservedName: reserved[name],
      currentBlockTimestamp,
    })
  ) {
    throw new ContractError(ARNS_NAME_RESERVED_MESSAGE);
  }

  if (isShortNameRestricted({ name, currentBlockTimestamp })) {
    throw new ContractError(INVALID_SHORT_NAME);
  }
}

export function calculateExistingAuctionBidForCaller({
  caller,
  auction,
  submittedBid,
  requiredMinimumBid,
}: {
  caller: string;
  auction: AuctionData;
  submittedBid: number;
  requiredMinimumBid: IOToken;
}): IOToken {
  let finalBid = submittedBid
    ? Math.min(submittedBid, requiredMinimumBid.valueOf())
    : requiredMinimumBid.valueOf();

  if (caller === auction.initiator) {
    finalBid -= auction.floorPrice;
  }
  return new IOToken(finalBid);
}

export function isGatewayJoined({
  gateway,
  currentBlockHeight,
}: {
  gateway: DeepReadonly<Gateway> | undefined;
  currentBlockHeight: BlockHeight;
}): boolean {
  if (!gateway) return false;
  return (
    gateway.status === 'joined' && gateway.end > currentBlockHeight.valueOf()
  );
}

export function isGatewayHidden({
  gateway,
}: {
  gateway: DeepReadonly<Gateway> | undefined;
}): boolean {
  if (!gateway) return false;
  return gateway.status === 'hidden';
}

export function isGatewayEligibleToBeRemoved({
  gateway,
  currentBlockHeight,
}: {
  gateway: DeepReadonly<Gateway> | undefined;
  currentBlockHeight: BlockHeight;
}): boolean {
  return (
    gateway.status === 'leaving' && gateway.end <= currentBlockHeight.valueOf()
  );
}

export function isGatewayEligibleToLeave({
  gateway,
  currentBlockHeight,
  registrySettings,
}: {
  gateway: DeepReadonly<Gateway> | undefined;
  currentBlockHeight: BlockHeight;
  registrySettings: GatewayRegistrySettings;
}): boolean {
  if (!gateway) return false;
  const joinedForMinimum =
    currentBlockHeight.valueOf() >=
    gateway.start + registrySettings.minGatewayJoinLength;
  const isActiveOrHidden =
    isGatewayJoined({ gateway, currentBlockHeight }) ||
    isGatewayHidden({ gateway });
  return joinedForMinimum && isActiveOrHidden;
}

export function calculateYearsBetweenTimestamps({
  startTimestamp,
  endTimestamp,
}: {
  startTimestamp: BlockTimestamp;
  endTimestamp: BlockTimestamp;
}): number {
  const yearsRemainingFloat =
    (endTimestamp.valueOf() - startTimestamp.valueOf()) / SECONDS_IN_A_YEAR;
  return +yearsRemainingFloat.toFixed(2);
}
