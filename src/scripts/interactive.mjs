import pams from './pams.mjs';
import timer from './timer.mjs';


const info = document.getElementById('info');

document.addEventListener(
  "keydown",
  (event) => {
    switch (event.key) {
      case '1':
        pams.selected = 1;
        timer.restart();
        break;
      case '2':
        pams.selected = 1;
        timer.restart();
        break;
      case 'i':
        if (info.style.display == 'none') {
          info.style.display = 'block';
        } else {
          info.style.display = 'none';
        }
        break;
      case 'p':
        if (timer.running()) {
          timer.pause();
        } else {
          timer.resume();
        }
        break;

      case 'r':
        timer.restart();
        break;

      default:
        break;
    }
  },
  false
);