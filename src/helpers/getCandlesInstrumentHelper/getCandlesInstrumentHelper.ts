import type {
  APIResponseV3WithTime,
  CategorySymbolListV5,
  OHLCVKlineV5,
} from "bybit-api";

interface IRes
  extends APIResponseV3WithTime<
    CategorySymbolListV5<OHLCVKlineV5[], "linear" | "spot" | "inverse">
  > {}
export const getCandlesInstrumentHelper = ({ result }: IRes) => {
  const { list } = result;

  return list
    .map((el) => ({
      startTime: Number(el[0]),
      openPrice: Number(el[1]),
      highPrice: Number(el[2]),
      lowPrice: Number(el[3]),
      closePrice: Number(el[4]),
      volume: Number(el[5]),
      turnover: Number(el[6]),
    }))
    .reverse();
};
