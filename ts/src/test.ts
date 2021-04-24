import * as sut from "./app";

sut.setupServer("テスト")
    .then(console.log)
    .catch(console.log);

