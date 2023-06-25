const timestampToMilliseconds = function (timestamp) {
  const { seconds, nanos } = timestamp;
  const secondMillis = +seconds * 1000;
  const nanoMillis = nanos / 1000000;
  return secondMillis + nanoMillis;
};

const addDurations = function (...durations) {
  let sum = durations.reduce(function (acc, cur) {
    let secs = acc.seconds + cur.seconds;
    let nans = acc.nanos + cur.nanos;
    return { seconds: secs, nanos: nans };
  });

  while (sum.nanos >= 1000000000) {
    sum.seconds += 1;
    sum.nanos -= 1000000000;
  }
  return sum;
};

module.exports = timestampToMilliseconds;
