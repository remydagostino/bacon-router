var test = require('tape'),
    baconRouter = require('../bacon-router');

test('Pattern Analysis', function(t) {
  t.deepEqual(
    baconRouter.patternParts('/foo'),
    ['foo'],
    'Matches single parts'
  );

  t.deepEqual(
    baconRouter.patternParts('/foo/:id/baz'),
    ['foo',':id','baz'],
    'Matches multiple parts'
  );

  t.end();
});

test('Pattern Dissection', function(t) {
  t.deepEqual(
    baconRouter.dissectPattern('/foo'),
    {
      params: [],
      matcher: /\/foo(\?.*)?$/i
    },
    'Patterns with a no dynamic segments'
  );

  t.deepEqual(
    baconRouter.dissectPattern('/foo/:id'),
    {
      params: ['id'],
      matcher: /\/foo\/([^\/]*?)(\?.*)?$/i
    },
    'Patterns with a single dynamic segment'
  );

  t.deepEqual(
    baconRouter.dissectPattern('/foo/:id/:name'),
    {
      params: ['id','name'],
      matcher: /\/foo\/([^\/]*?)\/([^\/]*?)(\?.*)?$/i
    },
    'Patterns with a multiple dynamic segments'
  );

  t.deepEqual(
    baconRouter.dissectPattern('/foo/*'),
    {
      params: [],
      matcher: /\/foo\/.*(\?.*)?$/i
    },
    'Simple Wildcards'
  );

  t.deepEqual(
    baconRouter.dissectPattern('/foo/bar*/baz'),
    {
      params: [],
      matcher: /\/foo\/bar.*\/baz(\?.*)?$/i
    },
    'Advanced Wildcards'
  );

  t.end();
});

