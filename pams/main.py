"""
Original file is located at
    https://colab.research.google.com/drive/10syw7DMyZXuiybOz9_v-zraoucqm_G8h
"""

import os
import json
import random

import copy
import numpy as np
import matplotlib.pyplot as plt

from pams.runners import SequentialRunner
from pams.logs.base import Logger, OrderLog, MarketStepEndLog

am_dir = os.path.join('/', 'workspace', 'artificial-markets')

# Create config objects
shock_transfer_config = {
    "simulation": {
        "markets": ["SpotMarket-1", "SpotMarket-2", "IndexMarket-I"],
        "agents": ["FCNAgents-1", "FCNAgents-2", "FCNAgents-I", "ArbitrageAgents"],
        "sessions": [
            {"sessionName": 0,
             "iterationSteps": 100,
             "withOrderPlacement": True,
             "withOrderExecution": False,
             "withPrint": True,
             "maxNormalOrders": 3, "MEMO": "The same number as #markets",
             "maxHighFrequencyOrders": 0
             },
            {"sessionName": 1,
             "iterationSteps": 500,
             "withOrderPlacement": True,
             "withOrderExecution": True,
             "withPrint": True,
             "maxNormalOrders": 3, "MEMO": "The same number as #markets",
             "maxHighFrequencyOrders": 5,
             "events": ["FundamentalPriceShock"]
             }
        ]
    },

    "FundamentalPriceShock": {
        "class": "FundamentalPriceShock",
        "target": "SpotMarket-1",
        "triggerTime": 0,
        "priceChangeRate": -0.3,
        "enabled": True
    },
    "SpotMarket": {
        "class": "Market",
        "tickSize": 0.00001,
        "marketPrice": 300.0,
        "outstandingShares": 25000
    },
    "SpotMarket-1": {
        "extends": "SpotMarket"
    },
    "SpotMarket-2": {
        "extends": "SpotMarket"
    },
    "IndexMarket-I": {
        "class": "IndexMarket",
        "tickSize": 0.00001,
        "marketPrice": 300.0,
        "outstandingShares": 25000,
        "markets": ["SpotMarket-1", "SpotMarket-2"]
    },
    "FCNAgent": {
        "class": "FCNAgent",
        "numAgents": 500,
        "markets": ["Market"],
        "assetVolume": 50,
        "cashAmount": 15000,

        "fundamentalWeight": {"expon": [0.0]},
        "chartWeight": {"expon": [0.0]},
        "noiseWeight": {"expon": [0.9]},
        "noiseScale": 0.001,
        "timeWindowSize": [100, 200],
        "orderMargin": [0.0, 0.1]
    },

    "FCNAgents-1": {
        "extends": "FCNAgent",
        "markets": ["SpotMarket-1"],
    },
    "FCNAgents-2": {
        "extends": "FCNAgent",
        "markets": ["SpotMarket-2"]
    },
    "FCNAgents-I": {
        "extends": "FCNAgent",
        "markets": ["IndexMarket-I"],
    },
    "ArbitrageAgents": {
        "class": "ArbitrageAgent",
        "numAgents": 500,
        "markets": ["IndexMarket-I", "SpotMarket-1", "SpotMarket-2"],
        "assetVolume": 50,
        "cashAmount": 150000,
        "orderVolume": 1,
        "orderThresholdPrice": 1.0
    }
}

config1 = copy.deepcopy(shock_transfer_config)
config2 = copy.deepcopy(shock_transfer_config)

config1['FCNAgents-1']['fundamentalWeight'] = {'expon': [0.9]}
config2['FCNAgents-I']['fundamentalWeight'] = {'expon': [0.9]}


class NetworkLogger(Logger):
    """Saver of the market step class."""

    order_logs = []
    market_logs = []

    def process_order_log(self, log: OrderLog) -> None:
        self.order_logs.append(
            {
                "order_id": log.order_id,
                "market_id": log.market_id,
                "time": log.time,
                "agent_id": log.agent_id,
                "is_buy": log.is_buy,
                "kind": log.kind,
                "price": log.price,
                "volume": log.volume,
                "ttl": log.ttl,
            }
        )

    def process_market_step_end_log(self, log: MarketStepEndLog) -> None:
        self.market_logs.append(
            {
                "session_id": log.session.session_id,
                "market_time": log.market.get_time(),
                "market_id": log.market.market_id,
                "market_name": log.market.name,
                "market_price": log.market.get_market_price(),
                "fundamental_price": log.market.get_fundamental_price(),
            }
        )


class PamsExporter:
    def __init__(self, config, offset=0, prng=0):
        self.config = config
        self.logger = NetworkLogger()
        self.prng = prng
        self.runner = SequentialRunner(
            settings=self.config,
            prng=random.Random(prng),
            logger=self.logger
        )
        self.markets = self.config['simulation']['markets']
        self.duration = sum(
            map(
                lambda x: int(x['iterationSteps']),
                self.config['simulation']['sessions']
            )
        )
        # The first part of the simulation time can be cut
        self.offset = offset

    def run(self):
        self.runner.main()
        self._export()
        return self

    def draw(self, filename):
        fullname = os.path.join(am_dir, 'pams', filename)
        colors = 'rgb'
        for i, market in enumerate(self.markets):
            market_logs = dict(sorted(map(lambda x: (x["market_time"], x["market_price"]), filter(
                lambda x: x["market_id"] == i, self.logger.market_logs))))
            plt.plot(list(market_logs.keys()), list(
                market_logs.values()), label=market, c=colors[i])

        plt.xlabel("ticks")
        plt.ylabel("market price")
        plt.legend()
        plt.savefig(fullname)

    def save(self, filename):
        with open(filename, 'w') as f:
            f.write(json.dumps(self.results))

    def _export(self):
        self.prices = np.round(
            [
                log['market_price'] for log in self.logger.market_logs
            ], 3
        ).reshape(self.duration, len(self.markets)).T

        # Calculate INDEX
        self.prices = np.concatenate(
            (self.prices, [(self.prices[0]+self.prices[1])/2])
        )

        # time * numMarkets * 2(buy or sell) * x * 2 (groupId, agentId)
        self.trades = list()
        for t in range(self.offset, 600):
            t_logs = list()
            for m in range(3):
                m_logs = list()
                m_logs.append(
                    [[log['agent_id']//500, log['agent_id'] % 500]
                        for log in self.logger.order_logs if log['time'] == t and log['market_id'] == m and log['is_buy']]
                )  # buy
                m_logs.append(
                    [[log['agent_id']//500, log['agent_id'] % 500]
                        for log in self.logger.order_logs if log['time'] == t and log['market_id'] == m and not log['is_buy']]
                )  # sell
                t_logs.append(m_logs)
            self.trades.append(t_logs)

        self.duration -= self.offset
        self.prices = self.prices[:, self.offset:]

        self.minPrice = np.min(self.prices)
        self.maxPrice = np.max(self.prices)

        self.results = {
            "trades": self.trades,
            "prices": self.prices.tolist(),
            "config": {
                "markets": self.markets,
                "duration": self.duration,
                "minPrice": self.minPrice,
                "maxPrice": self.maxPrice,
            }
        }

if __name__ == '__main__':
    pe = PamsExporter(config2, offset=80, prng=42).run()
    # pe.draw(f'fig_{prng}')
    pe.save(os.path.join(am_dir, 'src', 'res', 'pams2.json'))
