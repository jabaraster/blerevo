import * as _ from "../less/style.less";
import { Elm } from "../elm/Index.elm";
import * as Funcs from "../ts/funcs";

var app = Elm.Index.init({
  node: document.getElementById('app')
});
app.ports.requestLoadCycles.subscribe((server) => {
  Funcs.listCycles(server)
    .then(res => {
      console.log(res);
      app.ports.receiveCycles.send(res);
    })
    .catch(err => {
      console.log(err);
    });
});