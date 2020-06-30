import * as _ from "../less/style.less";
import { Elm } from "../elm/Index.elm";
import * as Funcs from "../ts/funcs";

var app = Elm.Index.init();
var ports = app.ports;

ports.requestSelectReportText.subscribe(_ => {
  const e = document.getElementById("report-text-input")
  if (e) e.select();
});

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

ports.requestUpdateDefeatedTime.subscribe(({ server, bossIdAtServer, time, reliability }) => {
  Funcs.updateDefeatedTime(server, bossIdAtServer, time, reliability)
    .then(res => {
      // 処理なし
    })
    .catch(err => {
      console.log(err);
    });
});

ports.requestSaveViewOption.subscribe((viewOption) => {
  Funcs.saveViewOption(viewOption);
});
ports.requestGetViewOption.subscribe(_ => {
  const ret = Funcs.getViewOption();
  if (ret.exists) {
    ports.receiveViewOption.send(ret.result);
  }
});