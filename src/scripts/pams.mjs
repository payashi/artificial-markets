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

import pams1 from '../pams1.json';
import pams2 from '../pams2.json';

const pams = {
    selected: 1,
    set(selected) {
        this.selected = selected;
    },
    data: function () {
        if (this.selected == 1) {
            return pams1;
        } else if (this.selected == 2) {
            return pams2;
        } else {
            console.error(`Invalid index for pams data: ${selected}`);
        }
    }
};


export default pams;