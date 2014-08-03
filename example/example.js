(function(w, router) {
  var hashStream, usersScreen, userScreen, contactsScreen;

  // Does nothing
  var myRouter = router.setup(
    window,
    {
      users: {
        index  : '#/users',
        user   : '/:id',
        create : '/create'
      },
      login    : '#/login'
    }
  );

  // Should log all hash changes
  router.asEventStream(w).log();

})(window, baconRouter);
