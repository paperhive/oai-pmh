export class AsyncIterable {
  constructor () {
    if (this.getNext === undefined) {
      throw new Error(
        'Derived class must implement a getNext method that returns a promise'
      )
    }
    this._done = false
  }

  done () {
    this._done = true
  }

  [Symbol.iterator] () {
    return {
      next: () => {
        // has the last element been returned?
        if (this._done) {
          return { done: true }
        }

        // make sure that no promise is currently running
        if (this.running) {
          throw new Error('There is still a promise running. Did you forget to await it?')
        }

        // make sure that the last promise wasn't rejected
        if (this.failed) {
          throw new Error('The last promise failed. Check your error handling.')
        }

        // set state to running
        this.running = true

        // get next promise
        const next = this.getNext()

        // hook to next promise
        next.then(
          // resolved
          () => { this.running = false },
          // rejected
          (e) => { this.failed = true; throw e }
        )

        return { value: next }
      }
    }
  }
}
