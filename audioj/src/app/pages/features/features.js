angular.module( 'pages.features', [
  'ui.router',
  'ui.bootstrap'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'features', {
    url: '/features',
    views: {
      "main": {
        controller: 'FeaturesCtrl',
        templateUrl: 'pages/features/features.tpl.html'
      }
    },
    data:{ pageTitle: 'Features' }
  });
})

/**
 * And of course we define a controller for our route.
 */
  .controller( 'FeaturesCtrl', function FeaturesController( $scope ) {
  })

;
