import * as _ from "../less/style.less";
import { Elm } from "../elm/Index.elm";
import * as Funcs from "../ts/funcs";

var app = Elm.Index.init({
  node: document.getElementById('app')
});
var ports = app.ports;

ports.requestLoadCycles.subscribe((server) => {
  Funcs.listCycles(server)
    .then(res => {
      app.ports.receiveCycles.send(res);
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