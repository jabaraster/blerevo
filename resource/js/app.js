import * as _ from "../less/style.less";
import { Elm } from "../elm/Index.elm";
import * as Funcs from "../ts/funcs";

var app = Elm.Index.init();
var ports = app.ports;

ports.requestLoadCycles.subscribe((server) => {
  const callback = (boss) => {
    ports.receiveUpdate.send(boss);
  };
  Funcs.listCycles(server, callback)
    .then(res => {
      ports.receiveCycles.send(res);
    })
    .catch(err => {
      console.log(err);
    });
});

ports.requestUpdateDefeatedTime.subscribe(({ server, bossIdAtServer, time }) => {
  Funcs.updateDefeatedTime(server, bossIdAtServer, time)
    .then(res => {
      // 処理なし
    })
    .catch(err => {
      console.log(err);
    });
});