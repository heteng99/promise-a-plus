import { Promise as MyPromise } from './promise.js';
import aplusTester from 'promises-aplus-tests';

MyPromise.deferred = function () {
  var result = {};
  result.promise = new MyPromise(function (resolve, reject) {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
};

aplusTester(MyPromise);
