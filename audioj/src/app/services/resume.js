

angular.module("audioj")

  .factory("ResumeDataService", function( $q, $http, localStorageService ){
    // magic happens here
    var cache,
        host = "http://resumaker/api",
        paths = {
          skill: "/skills",
          link: "/links",
          project: "/projects",
          school: "/schools",
          company: "/companies",
          role: "/roles",
          responsibility: "/responsibilities",
          vitals: "/vitals"
        };

    var modelFactory = function (route, fields, links) {

      return function(fields){
         var key,
             output,
             _links = (links) ? angular.copy(links, _links) : {},
             url = host + route,
             name = route.replace("/", "");

        output = {
          $save: function(){
            var data = {},
                that = this;
            data[name] = [this];


            return $http.post(url, data).error(function(){
              console.log("errorsave", arguments);
            }).success(function(data, status_code){
              var field,
                  resource;
              resource = data[name][0];
              that.id = resource.id;
              for (field in fields) {
                if (!fields.hasOwnProperty(field)){ continue; }
                that[field] = resource[field];
              }
              console.log("successsave", arguments, this);
            }).then(function(){
              return that;
            });

          },
          links: _links
        };

        for (key in fields) {
          if (!fields.hasOwnProperty(key)){ continue; }
          output[key] = fields[key];
        }

        return output;
      };
    };


    var companyModel = modelFactory(
          paths.company,
          ["name", "description", "date_started", "date_completed"],
          {
            roles: [],
            tags: []
          }
        ),
        roleModel = modelFactory(
          paths.role,
          ["name", "description", "date_started", "date_completed"],
          {
            company: undefined,
            responsibilities: [],
            tags: []
          }
        ),
        responsibilityModel = modelFactory(
          paths.responsibility,
          ["name", "description"],
          {
            role: undefined,
            tags: []
          }
        ),
        skillModel = modelFactory(
          paths.skill,
          ["name", "description"],
          {
            tags: []
          }
        ),
        linkModel = modelFactory(
          paths.link,
          ["name", "description"],
          {
            tags: []
          }
        ),
        projectModel = modelFactory(
          paths.project,
          ["name", "description", "date_started", "date_completed"],
          {
            tags: []
          }
        ),
        schoolModel = modelFactory(
          paths.school,
          ["name", "description", "date_started", "date_completed"],
          {
            tags: []
          }
        ),
        vitalsModel = modelFactory(
          paths.vitals,
          ["name", "phone", "email", "address", "city", "state", "country", "zip"],
          {
            tags: []
          }
        );

    var resourceFactory = function(route, identity, model){
      /*
       * Creates a model resource exposing methods to create a new object, get an object, or get all.
       */

      var _cache = {};

      var Resource = function(){
       return model();
      };

      Resource._get = function(id) {
        /*
         * Retrieves a single resource from remote on the basis of a provided ID.
         * If no ID is provided, retrieves all resources from remote.
         * Casts the remote resource to a model and returns a promise.
         */

        var path = route;
        path = (id) ? path + "/" + id : path;

        return $http.get(host + path).error(function(){
          console.log("error", arguments);


        }).success(function(data, status_code, _, response){
          data.errors = (data.errors) ? data.errors : [];
          if (status_code !== 200) {
            data.errors.push("HTTP " + status_code + " response while retrieving " + response.url);
          }
          return data;


        }).then(function(data){
          /*
           * Call model() on each of the resources.
           * Returns a data/identity object with an array of model resources.
           */
          var resources = [],
              output = {};

          angular.forEach(data.data[identity], function(val){
            resources.push(model(val));
          });

          output[identity] = resources;
          return output;


        }).then(function(data){
          /*
           * Load data into ID lookup service.
           * Here we iterate over the entire object and push into the cache for id-based lookups via .get()
           */
          if (data && data[identity]) {
            angular.forEach(data[identity], function(val){
              _cache[val.id] = val;
            });
          }
          return data;


        }).then(function(data){
          // Return just the data, none of the cruft.
          return data;
        });
      };

      Resource.add = function(resource) {
        _cache[resource.id] = resource;
      };


      Resource.get = function(id) {
        //TODO:  this function returns data from cache, and is perhaps misnamed or has an inconsistent interface.
        // What if we want to get data from a remote resource for just one record?  Should this _always_ return a promise?
        // Or should we have two records - one for the cache and another for the remote?
        var resource = _cache[id];
        //console.log(resource, _cache);
        if (_cache[id]) {
          return resource;
        }
        console.log("Warning: services/resume.js\nResource.get() method has only implemented retrieval from cache, no HTTP remote retrival yet exists.");
        //return this._get();
      };


      Resource.all = function(){
        return this._get();
      };

      return Resource;
    };


    return {
      __template: function(a) {
        /*
         * Accept an argument that is either undefined, an integer
         * If the argument is undefined, retrieve all
         * If the argument is an integer, retrieve a single record with that integer
         *
         * Should I use ng-resource?
         * maybe.  no.  The requirement for pre- and post- request hooks is incompatible with the API
         * format as I have defined it.
         *
         * But I should steal some of its concepts -
         * return a promise
         * the eventual then() method will return a single object or an array
         * the returned objects will expose a save() method
         * that's about it.
         *
         *
         * Create a new object like:
         * var newCompany = ResumeDataService.company();
         *
         * Retrieve a record like:
         * var existingCompany = ResumeDataService.company.get(1);
         *
         * Retrieve all records like:
         * var allCompanies = ResumeDataService.company.all();
         *
         * var Company = ResumeDataService.Company;
         *
         * newCompany = Company();
         * existingCompany = Company.get(1);
         * allCompanies = Company.all();
         *
         *
         *
         * where Company() returns a new company object with the aforementioned save() method
         *
         */
      },
      Company: resourceFactory(paths.company, "companies", companyModel),
      Role: resourceFactory(paths.role, "roles", roleModel),
      Responsibility: resourceFactory(paths.responsibility, "responsibilities", responsibilityModel),
      Skill: resourceFactory(paths.skill, "skills", skillModel),
      Project: resourceFactory(paths.project, "projects", projectModel),
      Link: resourceFactory(paths.link, "links", linkModel),
      School: resourceFactory(paths.school, "schools", schoolModel),
      Vitals: resourceFactory(paths.vitals, "vitals", vitalsModel)
    };
  })

;

