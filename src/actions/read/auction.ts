import {
  MINIMUM_ALLOWED_NAME_LENGTH,
  SHORT_NAME_RESERVATION_UNLOCK_TIMESTAMP,
} from '../../constants';
import { ContractResult, IOState, PstAction } from '../../types';
import {
  calculatePermabuyFee,
  calculateTotalRegistrationFee,
  getAuctionPrices,
} from '../../utilities';

declare const SmartWeave: any;

export const getAuction = (
  state: IOState,
  { input: { name, type = 'lease' } }: PstAction,
): ContractResult => {
  const { records, auctions, settings, fees, reserved } = state;
  const formattedName = name.toLowerCase().trim();
  const auction = auctions[formattedName];
  const auctionSettings = settings.auctions;

  if (!auction) {
    const { floorPriceMultiplier, startPriceMultiplier } = auctionSettings;

    const registrationFee =
      type === 'lease'
        ? calculateTotalRegistrationFee(
            name,
            fees,
            1,
            +SmartWeave.block.timestamp,
          )
        : calculatePermabuyFee(name, fees, +SmartWeave.block.timestamp);

    const floorPrice = registrationFee * floorPriceMultiplier;
    const startPrice = floorPrice * startPriceMultiplier;

    const prices = getAuctionPrices({
      auctionSettings,
      startHeight: +SmartWeave.block.height, // set it to the current blockheight
      startPrice,
      floorPrice,
    });

    // TODO: check record and reserved name expirations
    const record = records[formattedName];
    // add grace period
    const isExistingActiveRecord =
      record &&
      record.endTimestamp &&
      record.endTimestamp > +SmartWeave.block.timestamp;

    const reservedName = reserved[formattedName];
    const isActiveReservedName =
      reservedName &&
      reservedName.endTimestamp &&
      reservedName.endTimestamp > +SmartWeave.block.timestamp;

    const isShortNameRestricted =
      formattedName.length < MINIMUM_ALLOWED_NAME_LENGTH &&
      SmartWeave.block.timestamp < SHORT_NAME_RESERVATION_UNLOCK_TIMESTAMP;

    const isAvailableForAuction =
      !isExistingActiveRecord &&
      !isActiveReservedName &&
      !isShortNameRestricted;

    const isRequiredToBeAuctioned =
      formattedName.length > MINIMUM_ALLOWED_NAME_LENGTH && formattedName < 12;

    return {
      result: {
        name,
        prices,
        isActive: false,
        isAvailableForAuction: isAvailableForAuction,
        isRequiredToBeAuctioned: isRequiredToBeAuctioned,
        minimumBid: floorPrice, // since its not active yet, the minimum bid is the floor price
        endHeight: +SmartWeave.block.height + auctionSettings.auctionDuration,
        settings: auctionSettings,
      },
    };
  }

  const { startHeight, floorPrice, startPrice } = auction;
  const expirationHeight = startHeight + auctionSettings.auctionDuration;

  const prices = getAuctionPrices({
    auctionSettings,
    startHeight,
    startPrice,
    floorPrice,
  });

  return {
    result: {
      ...auction,
      endHeight: expirationHeight,
      // TODO: inclusive or exclusive here
      isActive: expirationHeight > +SmartWeave.block.height,
      isAvailableForAuction: false,
      isRequiredToBeAuctioned: prices,
    },
  };
};
