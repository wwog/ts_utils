export class ListNode<I> {
  static readonly Undefined = new ListNode<any>(undefined);

  element: I;
  next: ListNode<I> = ListNode.Undefined;
  prev: ListNode<I> = ListNode.Undefined;

  constructor(element: I) {
    this.element = element;
  }
}
/**
 * doubly linked list.
 */
export class LinkedList<I> {
  private _head: ListNode<I> = ListNode.Undefined;
  private _tail: ListNode<I> = ListNode.Undefined;
  private _length = 0;

  static fromArray<I>(array: I[]) {
    const list = new LinkedList<I>();
    array.forEach((item) => list.push(item));
    return list;
  }

  get len() {
    return this._length;
  }

  get head() {
    return this._head;
  }

  get tail() {
    return this._tail;
  }

  isEmpty() {
    return this._length === 0;
  }

  clear() {
    let node = this._head;
    while (node !== ListNode.Undefined) {
      const next = node.next;
      node.next = ListNode.Undefined;
      node.prev = ListNode.Undefined;
      node = next;
    }
    this._head = ListNode.Undefined;
    this._tail = ListNode.Undefined;
    this._length = 0;
  }

  push(element: I) {
    return this._insert(element, true);
  }

  unshift(element: I) {
    return this._insert(element, false);
  }

  insertAfter(element: I, node: ListNode<I>) {
    if (node === this._tail) {
      return this.push(element);
    }
    const newNode = new ListNode(element);
    newNode.next = node.next;
    newNode.prev = node;
    node.next.prev = newNode;
    node.next = newNode;
    this._length++;
    return newNode;
  }

  insertBefore(element: I, node: ListNode<I>) {
    if (node === this._head) {
      return this.unshift(element);
    }
    const newNode = new ListNode(element);
    newNode.next = node;
    newNode.prev = node.prev;
    node.prev.next = newNode;
    node.prev = newNode;
    this._length++;
    return newNode;
  }

  private _insert(element: I, atTheEnd: boolean) {
    const node = new ListNode(element);
    if (this._length === 0) {
      this._head = node;
      this._tail = node;
    } else if (atTheEnd) {
      this._tail.next = node;
      node.prev = this._tail;
      this._tail = node;
    } else {
      this._head.prev = node;
      node.next = this._head;
      this._head = node;
    }
    this._length++;
    return node;
  }

  shift() {
    if (this._length === 0) {
      return undefined;
    }
    const node = this._head;
    this._remove(node);
    return node.element;
  }

  pop() {
    if (this._length === 0) {
      return undefined;
    }
    const node = this._tail;
    this._remove(node);
    return node.element;
  }

  private _remove(node: ListNode<I>) {
    if (node.prev !== ListNode.Undefined) {
      node.prev.next = node.next;
    } else {
      this._head = node.next;
    }
    if (node.next !== ListNode.Undefined) {
      node.next.prev = node.prev;
    } else {
      this._tail = node.prev;
    }
    node.next = ListNode.Undefined;
    node.prev = ListNode.Undefined;
    this._length--;
  }

  find(predicate: (element: I) => boolean): ListNode<I> | undefined {
    let node = this._head;
    while (node !== ListNode.Undefined) {
      if (predicate(node.element)) {
        return node;
      }
      node = node.next;
    }
    return undefined;
  }

  findAll(predicate: (element: I) => boolean): ListNode<I>[] {
    const nodes: ListNode<I>[] = [];
    let node = this._head;
    while (node !== ListNode.Undefined) {
      if (predicate(node.element)) {
        nodes.push(node);
      }
      node = node.next;
    }
    return nodes;
  }

  removeNode(node: ListNode<I>) {
    return this._remove(node);
  }

  remove(predicate: (element: I) => boolean) {
    const node = this.find(predicate);
    if (node === undefined) {
      return;
    }
    this._remove(node);
  }

  *[Symbol.iterator]() {
    let node = this._head;
    while (node !== ListNode.Undefined) {
      yield node.element;
      node = node.next;
    }
  }

  toArray() {
    return [...this];
  }

  toString() {
    return this.toArray().toString();
  }
}
