require('../less/style.less');
const { Elm } = require('../src/Index.elm');

var app = Elm.Index.init({
  node: document.getElementById('elm')
});