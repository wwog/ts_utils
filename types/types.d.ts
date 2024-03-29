interface ErrorConstructor {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
   */
  stackTraceLimit?: number;
}

declare type PlatformEnv = "production" | "development" | "test";
