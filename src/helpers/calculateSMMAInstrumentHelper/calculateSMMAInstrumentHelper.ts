interface IData
  extends Array<{
    startTime: number;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    closePrice: number;
    volume: number;
    turnover: number;
  }> {}

export const calculateSMMAInstrumentHelper = (
  candles: IData,
  period = 200
) => {
  const highPriceResult: number[] = [];
  const lowPriceResult: number[] = [];

  let prevHighPriceSMMA = 0;
  let prevLowPriceSMMA = 0;

  for (let i = 0; i < candles.length; i++) {
    const highPrice = candles[i].highPrice;
    const lowPrice = candles[i].lowPrice;

    if (i < period) {
      const highPriceSum = candles
        .slice(0, i + 1)
        .reduce((acc, val) => acc + val.highPrice, 0);

      const lowPriceSum = candles
        .slice(0, i + 1)
        .reduce((acc, val) => acc + val.lowPrice, 0);

      const highPriceAverage = highPriceSum / (i + 1);
      const lowPriceAverage = lowPriceSum / (i + 1);

      highPriceResult.push(highPriceAverage);
      lowPriceResult.push(lowPriceAverage);

      prevHighPriceSMMA = highPriceAverage;
      prevLowPriceSMMA = lowPriceAverage;
    } else {
      const highPriceSMMA =
        (prevHighPriceSMMA * (period - 1) + highPrice) / period;
      const lowPriceSMMA =
        (prevLowPriceSMMA * (period - 1) + lowPrice) / period;

      highPriceResult.push(highPriceSMMA);
      lowPriceResult.push(lowPriceSMMA);

      prevHighPriceSMMA = highPriceSMMA;
      prevLowPriceSMMA = lowPriceSMMA;
    }
  }

  return {
    highSMMA: highPriceResult,
    lowSMMA: lowPriceResult,
  };
};
