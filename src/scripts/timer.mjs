import { Clock } from 'three';

const timer = {
  clock: new Clock(),
  _pauseTime: 0,
  running: function () {
    return this.clock.running;
  },
  pause: function () {
    this._pauseTime = this.clock.elapsedTime;
    this.clock.stop();
  },
  resume: function () {
    this.clock.start();
    this.clock.elapsedTime = this._pauseTime;
  },
  restart: function () {
    this.clock.start();
    this._pauseTime = 0;
  },
  time: function () {
    return this.clock.getElapsedTime();
  }
};


export default timer;