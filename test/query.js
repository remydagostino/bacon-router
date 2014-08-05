var test = require('tape'),
    baconRouter = require('../bacon-router');

test('Query strings', function(t) {
  t.deepEqual(
    baconRouter.parseQueryString(''),
    {},
    'Empty strings are empty queries'
  );

  t.deepEqual(
    baconRouter.parseQueryString('?'),
    {},
    'Empty queries are empty objects'
  );

  t.deepEqual(
    baconRouter.parseQueryString('?foo=bar'),
    { foo: 'bar' },
    'Simple queries with single parameters'
  );

  t.deepEqual(
    baconRouter.parseQueryString('?foo=bar&baz=qux'),
    { foo: 'bar', baz: 'qux' },
    'Simple queries with multiple parameters'
  );

  t.deepEqual(
    baconRouter.parseQueryString('?foo[bar][baz]=qux'),
    { foo: { bar: { baz: 'qux' } } },
    'Complex queries with nested parameters'
  );

  t.end();
});
