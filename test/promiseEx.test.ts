import { expect, it, describe } from "vitest";
import { timeout } from "../src/promiseEx/timeout";

describe("timeout", () => {
  it("should timeout", async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve("done");
      }, 2000);
    });
    await expect(timeout(promise, { timeout: 1000 })).rejects.toThrowError(
      "timeout"
    );
  });

  it("should not timeout", async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve("done");
      }, 1000);
    });
    await expect(timeout(promise, { timeout: 2000 })).resolves.toBe("done");
  });

  it("should call timeoutCallback", async () => {
    let called = false
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve("done");
      }, 2000);
    });
    const timeoutCallback = () => {
      called = true
    };
    await expect(
      timeout(promise, { timeout: 1000, timeoutCallback })
    ).rejects.toThrowError("timeout");
    expect(called).toBe(true)
  });

  it("should use custom timeoutError", async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve("done");
      }, 2000);
    });
    const timeoutError = new Error("custom timeout");
    await expect(
      timeout(promise, { timeout: 1000, timeoutError })
    ).rejects.toThrowError("custom timeout");
  });
});
