import {StackTrace} from './stackTrace'

const consoleColorArray = [
  'background: rgb(149,123,0); color: #FFF;',
  'background: #cc4125; color: #FFF;',
  'background: #2bd32b; color: #000;',
]

/**
 * The only difference between synchronous and asynchronous debugging is that synchronous has a view function memory usage
 */
export function DebugSyncFn(debugName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      if (process.env.NODE_ENV === 'production') {
        // if production mode, return original method (skip debug
        return originalMethod.apply(this, args)
      }

      const date = new Date().toLocaleString()
      const prefix = [
        `%c[debug${debugName ? `:${debugName}` : ''}]%c${propertyKey}%c${date}`,
        ...consoleColorArray,
      ]
      const start = performance.now()
      //@ts-ignore
      const memStart = performance?.memory?.usedJSHeapSize
      const result = originalMethod.apply(this, args)
      //@ts-ignore
      const memEnd = performance?.memory?.usedJSHeapSize
      const end = performance.now()

      console.group(...prefix)
      console.log('Arguments: ', args)
      console.log('Result: ', result)
      console.log('Time:', end - start + 'ms')
      if (memStart && memEnd) {
        console.log('Memory:', memEnd - memStart, 'bytes')
      }
      console.log('Stacktrace:', StackTrace.create().toString())

      console.groupEnd()
      return result
    }
    return descriptor
  }
}

export function DebugAsyncFn(debugName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      if (process.env.NODE_ENV === 'production') {
        // if production mode, return original method (skip debug
        return originalMethod.apply(this, args)
      }

      const date = new Date().toLocaleString()
      const prefix = [
        `%c[debug${debugName ? `:${debugName}` : ''}]%c${propertyKey}%c${date}`,
        ...consoleColorArray,
      ]

      const start = performance.now()
      const result = await originalMethod.apply(this, args)
      const end = performance.now()

      console.group(...prefix)
      console.log('Arguments: ', args)
      console.log('Result: ', result)
      console.log('Time:', end - start + 'ms')
      console.log('StackTrace:', StackTrace.create().toString())
      console.groupEnd()
      return result
    }
    return descriptor
  }
}
