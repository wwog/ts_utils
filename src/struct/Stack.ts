export class Stack<I> {
  private _stack: I[] = [];

  get length() {
    return this._stack.length;
  }

  get() {
    if (this.length === 0) {
      return null;
    }
    return this._stack.pop();
  }

  put(...item: I[]) {
    return this._stack.push(...item);
  }

  clear() {
    this._stack = [];
  }
}
