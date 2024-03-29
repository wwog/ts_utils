import {StackTrace} from '../debug/stackTrace'
import {compose} from '../functional/compose'

export const WarnListenerSize = 1000
export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any): {dispose: () => void}
}

let id = 0
class UniqueContainer<T> {
  stack?: StackTrace
  public id = id++
  public dispose: () => void = () => {
    //@ts-ignore
    this.stack = null
    //@ts-ignore
    this.dispose = null
    //@ts-ignore
    this.value = null
  }
  constructor(public readonly value: T) {}
  setDisposeFunc(dispose: () => void) {
    this.dispose = compose(dispose, this.dispose)
  }
}
type ListenerContainer<T> = UniqueContainer<(data: T) => void>
type Listeners<T> = (ListenerContainer<T> | undefined)[]

const forEachListener = <T>(listeners: Listeners<T>, fn: (c: ListenerContainer<T>) => void) => {
  if (listeners instanceof UniqueContainer) {
    fn(listeners)
  } else {
    for (let i = 0; i < listeners.length; i++) {
      const l = listeners[i]
      if (l) {
        fn(l)
      }
    }
  }
}

export interface EmitterOptions<T> {
  onWillAddFirstListener?: () => void
  onDidAddFirstListener?: () => void
  onListenerError?: (e: any) => void
  onWillDispose?: (listenerContainer: ListenerContainer<T>) => void
  onDidDispose?: (listenerContainer: ListenerContainer<T>) => void
}
/**
 * example:
 *  const emitter = new Emitter<string>();
 *  const onCloseWindow = emitter.event
 *  const { dispose } = onCloseWindow((data) => {
 *    console.log("1", data);
 *  });
 *  dispose()
 *  onCloseWindow((data) => {
 *   console.log("2", data);
 *  });
 *
 */
export class Emitter<T> {
  private _event?: Event<T>
  protected _listeners?: Listeners<T>
  protected _options?: EmitterOptions<T>

  constructor(options?: EmitterOptions<T>) {
    this._options = options
  }

  /**
   * @description 清理所有的监听器
   * @description_en Clear all listeners
   */
  disposeAllListeners() {
    if (this._listeners) {
      forEachListener(this._listeners, (listener) => {
        listener.dispose()
      })
    }
  }

  get listenerSize() {
    return this._listeners?.length || 0
  }

  /**
   * @description 返回一个事件监听器
   * @description_en Returns an event listener
   */
  get event(): Event<T> {
    this._event ??= (listener: (e: T) => any, thisArgs?: any) => {
      if (thisArgs) {
        listener = listener.bind(thisArgs)
      }

      const dispose = () => {
        /* 
        Checking may be superfluous, and dispose may only be called after _event is executed
        _listeners must exist after _event is executed. 
        So the check here can be removed and, for safety's sake, retained
        */
        if (!this._listeners) {
          return
        }
        this._options?.onWillDispose?.(contained)
        const index = this._listeners!.indexOf(contained)
        if (index >= 0) {
          this._listeners!.splice(index, 1)
        }
        this._options?.onDidDispose?.(contained)
      }

      const contained = new UniqueContainer(listener)
      contained.stack = StackTrace.create()
      contained.setDisposeFunc(dispose)

      if (!this._listeners) {
        this._options?.onWillAddFirstListener?.()
        this._listeners = [contained]
        this._options?.onDidAddFirstListener?.()
      } else {
        if (this._listeners.length > WarnListenerSize) {
          console.warn(`listeners size is too large, current size is ${this._listeners.length}`)
        }
        this._listeners.push(contained)
      }

      return {
        dispose: contained.dispose,
      }
    }

    return this._event
  }

  private _deliver(listener: undefined | UniqueContainer<(value: T) => void>, value: T) {
    if (!listener) {
      return
    }
    const errorHandler = this._options?.onListenerError
    if (!errorHandler) {
      listener.value(value)
      return
    }
    try {
      listener.value(value)
    } catch (e) {
      errorHandler(e)
    }
  }

  /**
   * @description 触发事件
   * @description_en Trigger event
   */
  fire(data: T): void {
    if (!this._listeners) {
      return
    } else {
      const listeners = this._listeners.slice()
      forEachListener(listeners, (listener) => {
        this._deliver(listener, data)
      })
    }
  }

  /**
   * @description 触发事件,fire的别名
   * @description_en Trigger event，alias of fire
   */
  emit(data: T): void {
    this.fire(data)
  }
}
