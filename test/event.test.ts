import { expect, it, describe } from "vitest";
import { Emitter } from "../src/utils/Event";

describe("Emitter", () => {
  let emitter = new Emitter();

  it("should remove listener when dispose is called", () => {
    const mockListener = () => {};
    const { dispose } = emitter.event(mockListener);
    dispose();
    expect(emitter.listenerSize).toBe(0);
  });

  it("should add listener", () => {
    const mockListener = () => {};
    emitter.event(mockListener);
    expect(emitter.listenerSize).toBe(1);
  });

  it("should trigger listener when event is fired", () => {
    let receivedData;
    const mockListener = (data) => {
      receivedData = data;
    };
    emitter.event(mockListener);
    emitter.fire("test");
    expect(receivedData).toBe("test");
  });



  it("should not trigger listener after dispose is called", () => {
    let receivedData;
    const mockListener = (data) => {
      receivedData = data;
    };
    const { dispose } = emitter.event(mockListener);
    dispose();
    emitter.fire("test");
    expect(receivedData).toBeUndefined();
  });

  it("should handle listener error", () => {
    const mockError = new Error("test error");
    const mockListener = () => {
      throw mockError;
    };
    let receivedError;
    emitter = new Emitter({
      onListenerError: (e) => {
        receivedError = e;
      },
    });
    emitter.event(mockListener);
    emitter.fire("test");
    expect(receivedError).toBe(mockError);
  });
});
