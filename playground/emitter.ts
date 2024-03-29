import { Emitter } from "../src/utils/Event";

const emitter = new Emitter<string>({
  onDidAddFirstListener() {
    console.log("onDidAddFirstListener");
  },
  onWillAddFirstListener() {
    console.log("onWillAddFirstListener");
  },
  onDidDispose(listenerContainer) {
    console.log("onDidDispose", listenerContainer.id);
  },
  onWillDispose(listenerContainer) {
    console.log("onWillDispose", listenerContainer.id);
  },
  onListenerError(e) {
    console.log("onListenerError", e);
  },
});
const event = emitter.event((data) => {
  console.log("1", data);
});

event.dispose();

emitter.event((data) => {
  console.log("2", data);
});
emitter.event((data) => {
  setTimeout(() => {
    console.log("3", data);
  });
});

emitter.emit("hello");
console.log("end", emitter);
