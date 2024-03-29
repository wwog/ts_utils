export class Queue<I> {
  private _queue: I[] = []

  get length() {
    return this._queue.length
  }

  get() {
    if (this.length === 0) {
      return null
    }
    return this._queue.shift()
  }

  put(...item: I[]) {
    return this._queue.push(...item)
  }

  clear() {
    this._queue = []
  }
}
