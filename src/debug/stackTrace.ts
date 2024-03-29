export class StackTrace {
  public static create() {
    return new StackTrace(new Error().stack ?? '')
  }

  public static getGlobalLimit = () => Error?.stackTraceLimit
  public static setGlobalLimit(limit: number) {
    if (Error && Error.stackTraceLimit !== limit) {
      Error.stackTraceLimit = limit
    }
  }

  public readonly originStack: string[] = []

  private constructor(stackStr: string) {
    this.originStack = stackStr.split('\n')
  }

  getStack(excludeItems: number = 2) {
    return this.originStack.slice(excludeItems)
  }

  toString(excludeItems: number = 2) {
    return this.getStack(excludeItems).join('\n')
  }

  print(excludeItems: number = 2) {
    console.log(this.toString(excludeItems))
  }
}
