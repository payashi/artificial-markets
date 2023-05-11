import pams from './pams.mjs';
import timer from './timer.mjs';

// Press 1 to load PAMS's option 1
// Press 2 to load PAMS's option 2
document.addEventListener("keydown", (event) => {
    if (event.key == '1') {
        pams.selected = 1;
        timer.restart();
    } else if (event.key == '2') {
        pams.selected = 2;
        timer.restart();
    }
});

// Press P to pause/resume the animation
// Press R to restart the animation
document.addEventListener(
  "keydown",
  (event) => {
    switch (event.key) {
      case 'p':
        if (timer.running()) {
          timer.pause();
        } else {
          timer.resume();
        }
        break;

      case 'r':
        timer.restart();

      default:
        break;
    }
  },
  false
);