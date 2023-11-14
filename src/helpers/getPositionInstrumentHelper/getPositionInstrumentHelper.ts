import type {
  APIResponseV3WithTime,
  CategoryCursorListV5,
  CategoryV5,
  PositionV5,
} from "bybit-api";

interface IRes
  extends APIResponseV3WithTime<
    CategoryCursorListV5<PositionV5[], CategoryV5>
  > {}

export const getPositionInstrumentHelper = (
  { result }: IRes,
  symbol: string
) => {
  const { list } = result;

  const instrument = list.find((el) => el.symbol === symbol)!;

  const { leverage, tradeMode } = instrument;

  return {
    leverage,
    tradeMode,
  };
};
