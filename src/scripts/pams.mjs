/**
 * Load json files calculated by PAMS python library
 * https://github.com/masanorihirano/pams
 * 
 * Each JSON file contains a record of transactions and market prices
 * when artificial market simulations are performed in settings based on the following paper.
 * 
 * https://www.jstage.jst.go.jp/article/pjsai/JSAI2015/0/JSAI2015_1J4OS13a2/_article/-char/ja/
 * 
 */

import pams1 from '../res/pams1.json' assert {type: 'json'};
import pams2 from '../res/pams2.json' assert {type: 'json'};

const data1 = await pams1;
const data2 = await pams2;

const pams = {
    selected: 1,
    set(selected) {
        this.selected = selected;
    },
    data: function () {
        if (this.selected == 1) {
            return data1;
        } else if (this.selected == 2) {
            return data2;
        } else {
            return data1;
        }
    },
    trades: function (index) {
        return this.data().trades[index];
    },
    prices: function () {
        return this.data().prices;
    },
    config: function () {
        return this.data().config;
    },
};


export default pams;