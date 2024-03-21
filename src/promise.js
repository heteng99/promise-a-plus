const PromiseState = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
};

const queueAsyncTask = 'queueMicrotask' in globalThis ? queueMicrotask : setTimeout;

/** @see https://promisesaplus.com/#the-promise-resolution-procedure */
function resolvePromise(promise, x, resolve, reject) {
  if (x === promise) {
    return reject(new TypeError());
  }

  if ((x && typeof x === 'object') || typeof x === 'function') {
    let then;
    try {
      then = x.then;
    } catch (e) {
      return reject(e);
    }

    if (typeof then === 'function') {
      let isCalled = false;
      try {
        then.call(
          x,
          (y) => {
            if (isCalled) return;
            resolvePromise(promise, y, resolve, reject);
            isCalled = true;
          },
          (r) => {
            if (isCalled) return;
            reject(r);
            isCalled = true;
          },
        );
      } catch (e) {
        if (isCalled) return;
        reject(e);
      }
    } else {
      resolve(x);
    }
  } else {
    resolve(x);
  }
}

export class Promise {
  value = undefined;
  reason = undefined;
  state = PromiseState.PENDING;
  onfulfilledCbs = [];
  onrejectedCbs = [];

  static resolve(value) {
    if (value instanceof Promise) return value;
    return new Promise((resolve) => {
      resolve(value);
    });
  }

  static reject(reason) {
    return new Promise((_resolve, reject) => {
      reject(reason);
    });
  }

  constructor(executor) {
    const resolve = (value) => {
      if (this.state !== PromiseState.PENDING) return;
      this.value = value;
      this.state = PromiseState.FULFILLED;
      this.onfulfilledCbs.forEach((cb) => cb(this.value));
    };
    const reject = (reason) => {
      if (this.state !== PromiseState.PENDING) return;
      this.reason = reason;
      this.state = PromiseState.REJECTED;
      this.onrejectedCbs.forEach((cb) => cb(this.reason));
    };
    executor(resolve, reject);
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== 'function') onFulfilled = (value) => value;
    if (typeof onRejected !== 'function') {
      onRejected = (reason) => {
        throw reason;
      };
    }
    const promise2 = new Promise((resolve, reject) => {
      const handleFulfilled = () => {
        queueAsyncTask(() => {
          try {
            const x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      };
      const handleRejected = () => {
        queueAsyncTask(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      };
      if (this.state === PromiseState.FULFILLED) {
        handleFulfilled();
      } else if (this.state === PromiseState.REJECTED) {
        handleRejected();
      } else if (this.state === PromiseState.PENDING) {
        this.onfulfilledCbs.push(handleFulfilled);
        this.onrejectedCbs.push(handleRejected);
      }
    });
    return promise2;
  }
}
