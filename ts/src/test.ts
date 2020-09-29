import * as sut from "./app";

sut.setupServer("サクラ")
    .then(console.log)
    .catch(console.log);

