"""
Original file is located at
    https://colab.research.google.com/drive/10syw7DMyZXuiybOz9_v-zraoucqm_G8h
"""

import random
import matplotlib.pyplot as plt
from pams.runners import SequentialRunner
from pams.logs.base import Logger
from pams.logs.base import *
import copy
import numpy as np

# Create config objects 
shock_transfer_config = {
	"simulation": {
		"markets": ["SpotMarket-1", "SpotMarket-2", "IndexMarket-I"],
		"agents": ["FCNAgents-1", "FCNAgents-2", "FCNAgents-I", "ArbitrageAgents"],
		"sessions": [
			{	"sessionName": 0,
				"iterationSteps": 100,
				"withOrderPlacement": True,
				"withOrderExecution": False,
				"withPrint": True,
				"maxNormalOrders": 3, "MEMO": "The same number as #markets",
				"maxHighFrequencyOrders": 0
			},
			{	"sessionName": 1,
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
		# "fundamentalWeight": {"expon": [0.9]},
	},
	"FCNAgents-2": {
		"extends": "FCNAgent",
		"markets": ["SpotMarket-2"]
	},
	"FCNAgents-I": {
		"extends": "FCNAgent",
		"markets": ["IndexMarket-I"],
		"fundamentalWeight": {"expon": [9.0]},
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
	def __init__(self, config):
		self.config = config
		self.logger = NetworkLogger()
		self.runner = SequentialRunner(
			settings = config,
			prng = random.Random(42),
			logger = self.logger
		)
		self.markets = self.config['simulation']['markets']

	def run(self):
		self.runner.main()

	def draw(self):
		for i, market in enumerate(self.markets):
			market_logs = dict(sorted(map(lambda x: (x["market_time"], x["market_price"]), filter(lambda x: x["market_id"] == i, self.logger.market_logs))))
			plt.plot(list(market_logs.keys()), list(market_logs.values()), label=market)

		plt.xlabel("ticks")
		plt.ylabel("market price")
		plt.legend()
		plt.savefig('/workspace/artificial-markets/pams/fig')

	def export(self):
		# time: 0 ~ 599
		self.results = {
			"description": "shock_transfer2",
			"markets": self.config['simulation']['markets'],
			"duration": 600,
			"trades": [],
			"prices": np.round([ log['market_price']  for log in saver.market_logs], 3).reshape(600, 3).tolist(),
		}

		# time * numMarkets * 2(buy or sell) * x * 2 (groupId, agentId)
		all_logs = list()
		for t in range(600):
			t_logs = list()
			for m in range(3):
				m_logs = list()
				m_logs.append(
					[ [log['agent_id']//500, log['agent_id']%500] for log in saver.order_logs if log['time']==t and log['market_id']==m and log['is_buy']]
				) # buy
				m_logs.append(
					[ [log['agent_id']//500, log['agent_id']%500] for log in saver.order_logs if log['time']==t and log['market_id']==m and not log['is_buy']]
				) # sell
				t_logs.append(m_logs)
			all_logs.append(t_logs)

		results['trades'] = all_logs

# rm all json file
import json

# with open('pams2.json', 'x') as f:
#     f.write(json.dumps(results))

if __file__ == 'main':
	print(__file__)
