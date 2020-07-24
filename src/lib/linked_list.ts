
export class ListNode<T> {
  owner: LinkedList<T>
  next: ListNode<T>
  prev: ListNode<T>

  constructor(public value: T) {

  }

  remove(): boolean {
    if (this.owner) {
      return this.owner.remove(this) == this
    }
    return false
  }
}

export class LinkedList<T> {
  first: ListNode<T>
  last: ListNode<T>

  constructor(cells?: ListNode<T>[]) {
    this.appendAll(cells)
  }

  get isEmpty(): boolean{
    return !this.first
  }

  appendValues(values?: T[]) {
    if (values) {
      this.appendAll(values.map(value => new ListNode<T>(value)))
    }
  }

  appendAll(nodes?: ListNode<T>[]) {
    let prevNode = this.last
    if (nodes && nodes.length) {

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.owner) {
          continue
        }
        node.owner = this;
        node.prev = prevNode;
        if (prevNode) {
          prevNode.next = node
        }
        prevNode = node;
      }
      this.last = nodes[nodes.length - 1]
      if (!this.first) {
        this.first = nodes[0]
      }
    }
  }

  append(node: ListNode<T>) {
    if (!node || node.owner) {
      return false
    }
    node.owner = this;

    if (!this.first) {
      this.first = this.last = node
      return
    }

    if (this.last) {
      this.last.next = node;
    }
    node.prev = this.last

    this.last = node;
    return true
  }

  prepend(node: ListNode<T>) {
    if (!node || node.owner) {
      return false
    }
    node.owner = this;

    if (!this.first) {
      this.first = this.last = node
      return
    }

    node.next = this.first
    if (this.first) {
      this.first.prev = node
    }
    this.first = node
  }

  remove(node: ListNode<T>): ListNode<T> {
    if (node?.owner != this) {
      return null
    }

    if (this.first == node) {
      this.first = node.next
    }
    if (this.last == node) {
      this.last = node.prev
    }
    if (node.prev) {
      node.prev.next = node.next
    }
    if (node.next) {
      node.next.prev = node.prev
    }
    node.next = null;
    node.prev = null;
    node.owner = null;
    return node
  }

  pop(): ListNode<T> {
    return this.remove(this.last)
  }

  shift(): ListNode<T> {
    return this.remove(this.first)
  }

  iterator(reverse = false): ListIterator<T> {
    return new ListIterator<T>(this, reverse)
  }

  values(): T[]{
    let node = this.first
    const values: T[] = []
    while (node){
      values.push(node.value)
      node = node.next
    }
    return values
  }
}

export class ListIterator<T> {
  private peekNode: ListNode<T>

  constructor(private owner: LinkedList<T>, private reverse = false) {
    this.reset(reverse)
  }

  next(): ListNode<T> | null {
    let node = this.peekNode
    if (node) {
      this.peekNode = this.reverse ? node.prev : node.next
    }
    return node
  }

  get hasNext(): boolean {
    return !!this.peekNode
  }

  reset(reverse=false){
    this.reverse = !!reverse
    this.peekNode = this.reverse ? this.owner.last : this.owner.first
  }

}
