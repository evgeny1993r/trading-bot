export interface IPositionInstrumentList
  extends Array<{
    symbol: string;
    priceStep: string;
    position: {
      tradeMode: number;
      leverage: string;
    };
  }> {}
