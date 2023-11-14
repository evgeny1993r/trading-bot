export interface ICandlesInstrumentList
  extends Array<{
    symbol: string;
    priceStep: string;
    position: {
      tradeMode: number;
      leverage: string;
    };
    candles: {
      startTime: number;
      openPrice: number;
      highPrice: number;
      lowPrice: number;
      closePrice: number;
      volume: number;
      turnover: number;
    }[];
  }> {}
