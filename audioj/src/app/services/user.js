
angular.module("audioj")

  .factory("UserDataService", function($q, $http, localStorageService){

    var user,
        host = "http://resumaker/api",
        paths = {
          login: "/login",
          logout: "/logout",
          signup: "/signup",
          account: "/user"
        };

    function getUser(){
      return $http.get(host + paths.account).then(function(data){
        if (data.data && data.data.users) {
          user = data.data.users[0];
          return user;
        }
        return {};
      });
    }

    return {
      get: function(){
        var deferred = $q.defer();
        deferred.resolve(user);
        if (user) {
          return deferred.promise;
        }
        return getUser();
      },
      login: function(loginForm) {
        return $http.post(host + paths.login, loginForm).then(function(data){
          if (data.data && data.data.users) {
            user = data.data.users[0];
            return user;
          }
          return {};
        });
      },
      logout: function(){
        user = undefined;
        return $http.post(host + paths.logout);
      },
      signup: function(signupForm){
        return $http.post(host + paths.signup, signupForm);
      }
    };




  });