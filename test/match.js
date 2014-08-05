var test = require('tape'),
    baconRouter = require('../bacon-router');

test('Path Matching', function(t) {
  t.deepEqual(
    baconRouter.matchRoute('/bar', '/foo'),
    null,
    'No match returns null'
  );

  t.deepEqual(
    baconRouter.matchRoute('/foo', '/foo'),
    {
      match: '/foo',
      params: {},
      query: {}
    },
    'Matching routes return an object with params and query'
  );

  // Matching params
  t.deepEqual(
    baconRouter.matchRoute('/foo/:id', '/foo/13'),
    {
      match: '/foo/13',
      params: { id: '13' },
      query: {}
    },
    'Params are matched and their values are extracted'
  );

  t.deepEqual(
    baconRouter.matchRoute('/foo/:id/:name', '/foo/13/bill'),
    {
      match: '/foo/13/bill',
      params: { id: '13', name: 'bill' },
      query: {}
    },
    'Matching multiple params'
  );

  t.deepEqual(
    baconRouter.matchRoute('/foo/*', '/foo/barbazblah'),
    {
      match: '/foo/barbazblah',
      params: {},
      query: {}
    },
    'Routes can contain wildcards'
  );

  t.deepEqual(
    baconRouter.matchRoute('/foo', '/foo?bar=baz'),
    {
      match: '/foo?bar=baz',
      params: {},
      query: { bar: 'baz' }
    },
    'Basic matching of query params'
  );

  // Matching query
  t.deepEqual(
    baconRouter.matchRoute('/foo', '/foo?bar=hello&baz[floop]=world'),
    {
      match: '/foo?bar=hello&baz[floop]=world',
      params: {},
      query: {
        bar: 'hello',
        baz: { floop: 'world' }
      }
    },
    'Nested matching of query params'
  );

  t.end();
});
