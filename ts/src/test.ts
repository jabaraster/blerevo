import * as sut from "./app";

sut.setupServer("スモモ")
    .then(console.log)
    .catch(console.log);

