var test = require('tape'),
    baconRouter = require('../bacon-router');

console.log(baconRouter);

test('Path Matching', function(t) {
  t.plan(1);

  baconRouter.matchRoute('/bar', '/foo')
  .onEnd(function() {
    t.pass('No match');
  });
});
