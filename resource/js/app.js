import  '../less/style.less'
import { Elm } from '../elm/Index.elm'
import * as funcs from '../ts/funcs'
import * as auth from '../ts/auth'

var app = Elm.Index.init();
var ports = app.ports;

ports.requestSelectReportText.subscribe(_ => {
  const e = document.getElementById('report-text-input')
  if (e) e.select();
});

ports.requestLoadCycles.subscribe((server) => {
  const callback = (boss) => {
    ports.receiveUpdate.send(boss);
  };
  funcs.listCycles(server, callback)
    .then(res => {
      ports.receiveCycles.send(res);
    })
    .catch(err => {
      console.log(err);
    });
});

auth.onAuthStateChanged((user) => {
  ports.receiveAuthStateChanged.send(user)
})
ports.requestLogout.subscribe(() => {
  auth.logout()
})

ports.requestUpdateDefeatedTime.subscribe(({ server, bossIdAtServer, time, reliability }) => {
  funcs.updateDefeatedTime(server, bossIdAtServer, time, reliability)
    .then(res => {
      // 処理なし
    })
    .catch(err => {
      console.log(err);
    });
});

ports.requestSaveViewOption.subscribe((viewOption) => {
  funcs.saveViewOption(viewOption);
});
ports.requestGetViewOption.subscribe(_ => {
  const ret = funcs.getViewOption();
  if (ret.exists) {
    ports.receiveViewOption.send(ret.result);
  }
});
ports.requestRegisterNotification.subscribe((d) => {
  funcs.registerNotification(d)
})