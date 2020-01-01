const assert = require('assert');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const batchPromisesWithRetry = require('./index.js');

describe('index.spec.js', function () {
  var successCount = 0;
  var failureCount = 0;
  var retryCount = 0;
  var batchStartCount = 0;
  var batchEndCount = 0;

  const successPromise = {
    id: null,
    func: () => {
      successCount++;
      return Promise.resolve('successful value'); // this value is used by the onSuccess callback
    }
  }

  const failurePromise = {
    id: null,
    func: () => {
      failureCount++;
      return Promise.reject(new Error('rejected'));
    }
  }

  const retryPromiseGenerator = (retryTimes) => {
    var toRetry = retryTimes;
    return {
      id: null,
      func: () => {
        if (toRetry <= 0) {
          successCount++;
          return Promise.resolve('successful value')
        } else {
          toRetry --;
          retryCount++;
          return Promise.reject(new Error('please retry'));
        }
      }
    }
  }

  const onSuccessCallback = async (result) => {
    assert.equal(result, 'successful value')
    return true
  }

  beforeEach(() => {
    successCount = 0;
    failureCount = 0;
    retryCount = 0;
  })

  it('all promises succeed in execution', async () => {
    const promises = [
      successPromise,
      successPromise,
      successPromise,
    ];

    await batchPromisesWithRetry(promises, onSuccessCallback)
    assert.equal(successCount, 3)
    assert.equal(retryCount,   0)
    assert.equal(failureCount, 0)
  })

  it('all promises fail in execution', async () => {
    const promises = [
      failurePromise,
      failurePromise,
      failurePromise,
    ];
    await batchPromisesWithRetry(promises, onSuccessCallback)
    assert.equal(successCount, 0)
    assert.equal(failureCount, 3)
    assert.equal(retryCount,   0)
  })

  it('some promises retry', async () => {
    const promises = [
      successPromise,
      retryPromiseGenerator(4),
      retryPromiseGenerator(1),
    ]

    const retryFilters = [
      (err) => err.message == 'please retry',
    ]

    await batchPromisesWithRetry(promises, onSuccessCallback, { retryFilters })
    assert.equal(successCount, 3)
    assert.equal(failureCount, 0)
    assert.equal(retryCount,   5)
  })

  it('mix of all scenarios', async () => {
    const promises = [
      retryPromiseGenerator(3),
      retryPromiseGenerator(5),
      failurePromise,
      successPromise,
      failurePromise,
    ]

    const retryFilters = [
      (err) => err.message == 'please retry',
    ]

    await batchPromisesWithRetry(promises, onSuccessCallback, { retryFilters })
    assert.equal(successCount, 3)
    assert.equal(failureCount, 2)
    assert.equal(retryCount,   8)
  })

  it('test use of batchSize and delayBetweenBatches options', async () => {
    const options = {
      batchSize: 2,
      delayBetweenBatches: 10,
    }

    const promises = [
      successPromise,
      successPromise,
      successPromise,
    ];

    await batchPromisesWithRetry(promises, onSuccessCallback, options)
    assert.equal(successCount, 3)
    assert.equal(retryCount,   0)
    assert.equal(failureCount, 0)
  })

  it('test onSuccess, onFailure, onRetry, onBatchStart and onBatchEnd callbacks')
})






// const onbatchStartFunc = () => {
//   batchStartCount++;
//   return Promise.resolve;
// }
//
// const onbatchEndFunc = () => {
//   batchEndCount++;
//   return Promise.resolve;
// }
