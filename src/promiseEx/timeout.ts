export interface PromiseTimeoutOptions {
  /**
   * @description 超时时间
   * @description_en Timeout time
   * @default 1000ms
   */
  timeout?: number;
  /**
   * @description 超时回调函数
   * @description_en Timeout callback function
   */
  timeoutCallback?: (timeout: number) => void;
  /**
   * @description 超时错误
   * @description_en Timeout error
   * @default new Error('timeout')
   */
  timeoutError?: Error;
}
export function timeout<T>(
  promise: Promise<T>,
  options?: PromiseTimeoutOptions
): Promise<T> {
  const {
    timeout = 1000,
    timeoutCallback,
    timeoutError = new Error("timeout"),
  } = options || {};
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      timeoutCallback?.(timeout);
      reject(timeoutError);
    }, timeout);
    promise
      .then((value) => {
        resolve(value);
      })
      .catch((error) => {
        reject(error);
      })
      .finally(() => {
        clearTimeout(timer);
      });
  });
}
