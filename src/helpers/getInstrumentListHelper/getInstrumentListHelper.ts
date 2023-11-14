import type {
  APIResponseV3WithTime,
  InstrumentInfoResponseV5,
} from "bybit-api";

interface IRes
  extends APIResponseV3WithTime<InstrumentInfoResponseV5<"linear">> {}

export const getInstrumentListHelper = ({ result }: IRes, leverage: string) => {
  const { list } = result;

  return list
    .filter(
      ({ status, quoteCoin, leverageFilter }) =>
        status === "Trading" &&
        quoteCoin === "USDT" &&
        Number(leverageFilter.maxLeverage) >= Number(leverage)
    )
    .map(({ symbol, priceFilter }) => ({
      symbol,
      priceStep: priceFilter.tickSize,
    }));
};
