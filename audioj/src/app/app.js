


angular.module( 'audioj', [
  'ngCookies',
  'ngResource',
  'LocalStorageModule',
  'templates-app',
  'templates-common',
  'audioj.pages',
  'ui.router',
  'ui.route'
])


.config( function myAppConfig ( $locationProvider, $stateProvider, $urlRouterProvider, $httpProvider) {
  $urlRouterProvider.otherwise( '/tones' );
  $locationProvider.html5Mode(true).hashPrefix('!');
})

.controller( 'AppCtrl', function AppCtrl ( $scope, $location, $resource, localStorageService, UserDataService) {
  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | AudioJ' ;
    }
  });

})

;

