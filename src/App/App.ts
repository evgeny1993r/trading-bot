import { RestClientV5, WebsocketClient } from "bybit-api";
import { EventEmitter } from "events";
import { config } from "dotenv";

import { EVENT_LIST, MESSAGE_LIST } from "../constants";

import {
  getInstrumentListHelper,
  getPositionInstrumentHelper,
  getCandlesInstrumentHelper,
  calculateSMMAInstrumentHelper,
} from "../helpers";

import type {
  IInstrumentList,
  IPositionInstrumentList,
  ICandlesInstrumentList,
  ISMMAInstrumentList,
} from "../interfaces";

class App {
  private client: RestClientV5;
  private wsClient: WebsocketClient;
  private emitter: EventEmitter;

  private leverage: string;

  constructor() {
    config();

    this.client = new RestClientV5({
      key: process.env.KEY,
      secret: process.env.SECRET,
    });

    this.wsClient = new WebsocketClient({
      market: "v5",
      fetchTimeOffsetBeforeAuth: true,
      key: process.env.KEY,
      secret: process.env.SECRET,
    });

    this.emitter = new EventEmitter();

    this.leverage = "10";
  }

  public run = () => {
    this.handleEventList();

    this.emitter.emit(EVENT_LIST.GET_INSTRUMENT_LIST);
  };

  private handleEventList = () => {
    this.emitter.on(EVENT_LIST.GET_INSTRUMENT_LIST, () => {
      this.getInstrumentList();
    });

    this.emitter.on(
      EVENT_LIST.GET_POSITION_INSTRUMENT_LIST,
      (data: IInstrumentList) => {
        this.getPositionInstrumentList(data);
      }
    );

    this.emitter.on(
      EVENT_LIST.SET_TRADE_MODE_INSTRUMENT_LIST,
      (data: IPositionInstrumentList) => {
        this.setTradeModeInstrumentList(data);
      }
    );

    this.emitter.on(
      EVENT_LIST.SET_LEVERAGE_INSTRUMENT_LIST,
      (data: IPositionInstrumentList) => {
        this.setLeverageInstrumentList(data);
      }
    );

    this.emitter.on(
      EVENT_LIST.GET_CANDLES_INSTRUMENT_LIST,
      (data: IPositionInstrumentList) => {
        this.getCandlesInstrumentList(data);
      }
    );

    this.emitter.on(
      EVENT_LIST.FILTER_PRICE_STEP_INSTRUMENT_LIST,
      (data: ICandlesInstrumentList) => {
        this.filterPriceStepInstrumentList(data);
      }
    );

    this.emitter.on(
      EVENT_LIST.CALCULATE_SMMA_INSTRUMENT_LIST,
      (data: ICandlesInstrumentList) => {
        this.calculateSMMAInstrumentList(data);
      }
    );

    this.emitter.on(
      EVENT_LIST.FILTER_LAST_PRICE_IN_SMMA_INSTRUMENT_LIST,
      (data: ISMMAInstrumentList) => {
        this.filterLastPriceInSMMAInstrumentList(data);
      }
    );

    this.emitter.on(
      EVENT_LIST.SUBSCRIBE_WEBSOCKET_INSTRUMENT_LIST,
      (data: ISMMAInstrumentList) => {
        this.subscribeWebsocketInstrumentList(data);
      }
    );
  };

  private getInstrumentList = async () => {
    const { loading, error, success } = MESSAGE_LIST.getInstrumentList;

    console.log(loading);

    try {
      const result = getInstrumentListHelper(
        await this.client.getInstrumentsInfo({
          category: "linear",
        }),
        this.leverage
      );

      console.log(success(result.length));

      this.emitter.emit(EVENT_LIST.GET_POSITION_INSTRUMENT_LIST, result);
    } catch {
      throw Error(error);
    }
  };

  private getPositionInstrumentList = async (data: IInstrumentList) => {
    const { loading, error, success } = MESSAGE_LIST.getPositionInstrumentList;

    console.log(loading);

    const result = [];

    for (let i = 0; i < data.length; i++) {
      await new Promise((res) => setTimeout(res, 500));

      try {
        const { symbol } = data[i];

        const position = getPositionInstrumentHelper(
          await this.client.getPositionInfo({
            category: "linear",
            symbol,
          }),
          symbol
        );

        result.push({ ...data[i], position });
      } catch {
        throw Error(error);
      }
    }

    console.log(success);

    this.emitter.emit(EVENT_LIST.SET_TRADE_MODE_INSTRUMENT_LIST, result);
  };

  private setTradeModeInstrumentList = async (
    data: IPositionInstrumentList
  ) => {
    const { loading, error, success } = MESSAGE_LIST.setTradeModeInstrumentList;

    console.log(loading);

    const isNotTradeModeInstrument = data.filter(
      ({ position }) => position.tradeMode !== 1
    );

    for (let i = 0; i < isNotTradeModeInstrument.length; i++) {
      await new Promise((res) => setTimeout(res, 500));

      const { symbol } = isNotTradeModeInstrument[i];

      try {
        await this.client.switchIsolatedMargin({
          category: "linear",
          symbol,
          buyLeverage: this.leverage,
          sellLeverage: this.leverage,
          tradeMode: 1,
        });
      } catch {
        throw Error(error);
      }
    }

    console.log(success);

    this.emitter.emit(EVENT_LIST.SET_LEVERAGE_INSTRUMENT_LIST, data);
  };

  private setLeverageInstrumentList = async (data: IPositionInstrumentList) => {
    const { loading, error, success } = MESSAGE_LIST.setLeverageInstrumentList;

    console.log(loading);

    const isNotLeverageInstrumentList = data.filter(
      ({ position }) =>
        position.tradeMode === 1 && position.leverage !== this.leverage
    );

    for (let i = 0; i < isNotLeverageInstrumentList.length; i++) {
      await new Promise((res) => setTimeout(res, 500));

      const { symbol } = isNotLeverageInstrumentList[i];

      try {
        await this.client.setLeverage({
          category: "linear",
          symbol,
          buyLeverage: this.leverage,
          sellLeverage: this.leverage,
        });
      } catch {
        throw Error(error);
      }
    }

    console.log(success);

    this.emitter.emit(EVENT_LIST.GET_CANDLES_INSTRUMENT_LIST, data);
  };

  private getCandlesInstrumentList = async (data: IPositionInstrumentList) => {
    const { loading, error, success } = MESSAGE_LIST.getCandlesInstrumentList;

    console.log(loading);

    const result = await Promise.all(
      data.map(async (el) => {
        const { symbol } = el;

        try {
          const candles = getCandlesInstrumentHelper(
            await this.client.getKline({
              category: "linear",
              symbol,
              interval: "1",
              limit: 1000,
            })
          );

          return {
            ...el,
            candles,
          };
        } catch {
          throw Error(error);
        }
      })
    );

    console.log(success);

    this.emitter.emit(EVENT_LIST.FILTER_PRICE_STEP_INSTRUMENT_LIST, result);
  };

  private filterPriceStepInstrumentList = (data: ICandlesInstrumentList) => {
    const { success } = MESSAGE_LIST.filterPriceStepInstrumentList;

    const result = data.filter(
      ({ priceStep, candles }) =>
        (Number(priceStep) / candles[candles.length - 1].closePrice) * 100 <=
        0.05
    );

    console.log(success(result.length));

    this.emitter.emit(EVENT_LIST.CALCULATE_SMMA_INSTRUMENT_LIST, result);
  };

  private calculateSMMAInstrumentList = (data: ICandlesInstrumentList) => {
    const { success } = MESSAGE_LIST.calculateSMMAInstrumentList;

    const result = data.map((el) => {
      const { candles } = el;

      const smma = calculateSMMAInstrumentHelper(candles);

      return {
        ...el,
        smma,
      };
    });

    console.log(success);

    this.emitter.emit(
      EVENT_LIST.FILTER_LAST_PRICE_IN_SMMA_INSTRUMENT_LIST,
      result
    );
  };

  private filterLastPriceInSMMAInstrumentList = (data: ISMMAInstrumentList) => {
    const { success } = MESSAGE_LIST.filterLastPriceInSMMAInstrumentList;

    const result = data.filter(({ candles, smma }) => {
      const lastPrice = candles[candles.length - 1].closePrice;
      const lastSMMAHigh = smma.highSMMA[smma.highSMMA.length - 1];
      const lastSMMALow = smma.lowSMMA[smma.lowSMMA.length - 1];

      return lastPrice < lastSMMAHigh && lastPrice > lastSMMALow;
    });

    console.log(success(result.length));

    this.emitter.emit(EVENT_LIST.SUBSCRIBE_WEBSOCKET_INSTRUMENT_LIST, result);
  };

  private subscribeWebsocketInstrumentList = (data: ISMMAInstrumentList) => {
    const { success } = MESSAGE_LIST.subscribeWebsocketInstrumentList;

    this.wsClient.on("update", (res) => {
      console.log(res.topic.split("."));
    });

    data.forEach(({ symbol }) => {
      this.wsClient.subscribeV5(`kline.1.${symbol}`, "linear");
    });

    console.log(success);
  };
}

export default App;
