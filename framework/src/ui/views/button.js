//TODO DO THIS NICE
(function() {

    _.mixin({isNodeList: function( el ) {
        if( typeof el.length === 'number' && typeof el[0] === 'object' && el[0].hasOwnProperty('innerHTML') ) {
            return true;
        }
        return false;
    }});

    M.TemplateManager = M.Object.extend({

        containerTemplates: {
            defaultTemplate: '<div><div data-binding="value" contenteditable="true"><%= value %></div><div data-child-view="main"></div>'
        },

        buttonTemplates: {
            defaultTemplate: '<div>Button: <div data-binding="value"<% if(value) {  } %>><%= value %></div></div>',
            topcoat: '<button class="topcoat-button--large" data-binding="value"><%= value %></button>',
            bootstrap: '<button type="button" class="btn btn-default btn-lg"> <span class="glyphicon glyphicon-star" data-binding="value"></span><%= value %></button>',
            jqm: '<a href="#" data-role="button" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" class="ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c"><span class="ui-btn-inner"><span class="ui-btn-text" data-binding="value"><%= value %></span></span></a>'
        },

        toolbarTemplates: {
            defaultTemplate: '<div>AAA<div data-child-view="left"></div> <div class="center" data-binding="value"><%= value %></div> <div data-child-view="right"></div></div>',
            bootstrap: '<div class="page-header"><div data-child-view="left"></div><h1><%= value %></h1><div data-child-view="right"></div></div>',
            jqm: '<div data-role="header" class="ui-header ui-bar-a" role="banner"><div data-child-view="left" class="ui-btn-left"></div><h1 class="ui-title" role="heading" aria-level="1"><%= value %></h1><div data-child-view="right" class="ui-btn-right"></div></div>'
        },

        currentTemplate: 'jqm',

        get: function( template ) {
            if( this[template] ) {
                var tpl = this[template][M.TemplateManager.currentTemplate];
                if( !tpl ) {
                    return this[template]['defaultTemplate'];
                } else {
                    return tpl;
                }
            }
        }
    });


    M.Button = M.View.extend({

        _type: 'M.Button',

        initialize: function() {
            M.View.prototype.initialize.apply(this, arguments);
        },

        afterRender: function() {
            M.View.prototype.afterRender.apply(this, arguments);
        },

        contenteditable: true,

        template: _.tmpl(M.TemplateManager.get('buttonTemplates'))

    });

    M.Toolbar = M.View.extend({

        _type: 'M.Toolbar',

        template: _.tmpl(M.TemplateManager.get('toolbarTemplates')),

        getTemplateIdentifier: function() {

            return 'toolbarTemplates'
        },

        initialize: function() {
            M.View.prototype.initialize.apply(this, arguments);
        }

    });

    M.ContainerView = M.View.extend({

        _type: 'M.ContainerView',

        template: _.tmpl(M.TemplateManager.get('containerTemplates'))

    });

    //    M.Controller = function(){};
    //
    //    M.Controller.prototype._type = 'M.Controller';
    //
    //    M.Controller.prototype..onPageSwitch = function() {
    //
    //    };
    //
    //    M.Controller.prototype..initialLoad = function() {
    //
    //    };
    //
    //    M.Controller = M.Object.extend(M.Controller);
    //    M.Controller.create = M.create;


    M.Controller = function() {
        _.extend(this, arguments[0]);
        this.initialize(arguments[0]);
    };

    M.Controller.create = M.create;


    _.extend(M.Controller.prototype, Backbone.Events, {

        _type: 'M.Controller',

        initialize: function( options ) {
            return this;
        },

        set: function( name, value ) {
            this[name] = value;
            this.trigger(name, value);
        }
    });


    M.ListView = M.View.extend({

        _type: 'M.ListView',

        template: _.tmpl('<div data-child-view="list"></div>'),

        viewMapping: {},

        beforeRender: function() {
            console.log('before list render');
            if(this.hasRendered){
                this.addAll();
            }

        },

        initialize: function() {
            var that = this;
            M.View.prototype.initialize.apply(this, arguments);

            this.listenTo(this.model, 'add', function( model, collection ) {
                that.addOne(model, true);
            });

            this.listenTo(this.model, 'fetch', function() {
                console.log('fetch');
                that.addAll();
            });
            this.listenTo(this.model, 'remove', this.removeOne);

            this.listenTo(this.model, 'sort', function() {
                //remove all views and do a render update
                that.removeView();
                that.addAll(true);
            });

            //            this.listenTo(this.model, 'sync', function( a, b, c ) {
            //                debugger;
            //                //                that.render();
            //            });

            //            this.listenToOnce(this.model, 'reset', function( a, b, c ) {
            //                debugger;
            //                //                that.render();
            //            });

            //            this.addAll.apply(this);
        },

        removeOne: function( removedObj, collection, xhr ) {

            this._getViewMapping(removedObj.cid).remove();
            this._removeViewMapping(removedObj.cid);
        },

        serialize: function() {
            return this;
        },

        addAll: function( render ) {
            _.each(this.model.models, function( model ) {
                this.addOne.apply(this, [model, render]);
            }, this);


        },

        addOne: function( model, render ) {

            var view = this.listItemView.create({
                template: this.listItemView.template,
                value: model
            });

            this.insertView('[data-child-view="list"]', view);

            if( render ) {
                view.render();
            }

            //this._setViewMapping(view, model.cid);
        },

        _setViewMapping: function( view, cid ) {

            this.viewMapping[cid] = view;
        },

        _getViewMapping: function( cid ) {

            return this.viewMapping[cid];
        },

        _removeViewMapping: function( cid ) {

            delete this.viewMapping[cid];
        }
    });


    M.Router = Backbone.Router.extend({

        visitedRoutes: {},

        initialize: function() {

            this.bootstrap();

        },

        bootstrap: function() {

            FastClick.attach(document.body);

            $(document).on('click', 'a[href^="#"]', function( e ) {
                e.preventDefault();
                e.stopPropagation();
                return void 0;
            });

            window[window.TMP_APPLICATION_NAME].layoutManager = new (Backbone.Layout.extend());
        },

        controllerDidLoad: function( controller, res, callback ) {

            var _callback = this.getCallBack(controller);
            _callback && _callback.apply(this, [res]);
            callback();
        },

        callCallback: function( route, name, controller, res, callback ) {


            var that = this;
            if( _.isString(controller) ) {
                require([controller], function( ctrl ) {
                    that.controllerDidLoad(ctrl, res, callback);
                });
            } else if( M.Controller.prototype.isPrototypeOf(controller) ) {
                setTimeout(function() {
                    that.controllerDidLoad(controller, res, callback);
                }, 0);
            }

            return this;
        },

        getCallBack: function( controller ) {
            var _callback = null;
            if( Object.keys(this.visitedRoutes).length === 0 ) {
                _callback = controller.applicationStart;
            } else {
                _callback = controller.show;
            }
            return _callback;
        },

        route: function( route, name, controller ) {

            if( !_.isRegExp(route) ) {
                route = this._routeToRegExp(route);
            }
            if( _.isFunction(name) ) {
                controller = name;
                name = '';
            }
            if( !controller ) {
                controller = this[name];
            }

            var router = this;
            Backbone.history.route(route, function( fragment ) {
                var res = null;
                _.each(router.routes, function( val, key ) {
                    var string = route.toString().slice(1, -1);
                    var reg = new RegExp(string.replace(/\(\[\^/g, ':([^'));
                    var exec = reg.exec(key);
                    if( exec && exec.length ) {
                        res = exec.slice(1);
                    }
                });
                var args = router._extractParameters(route, fragment);
                res = _.object(res, args);
                args.unshift(!router.visitedRoutes[name]);
                router.callCallback(route, name, controller, res, function() {
                    router.trigger.apply(router, ['route:' + name].concat(args));
                    router.trigger('route', name, args);
                    Backbone.history.trigger('route', router, name, args);
                    if( !router.visitedRoutes[name] ) {
                        router.visitedRoutes[name] = true;
                    }
                });
            });
            return this;
        }

    });

    M.Router.create = M.create;


})();


//var P = {};
//
//Object.defineProperty(window, "Person", {
//    get: function() {
//        console.log('getter of person');
//        return P;
//    },
//    set: function( newValue ) {
//        console.log('setter of person');
//        debugger;
//        Object.keys(newValue).forEach(function(key){
//            P[key] = Object.defineProperty(P, key, {
//                get: function() {
//                    if(P[key] !== newValue){
//                        P[key] = newValue;
//                        console.log('getter of ' + key);
//                        return P[key];
//                    }
//                },
//                set: function( newValue ) {
//                    if(P[key] !== newValue)
//                        P[key] = newValue;
//
//                },
//                enumerable: true,
//                configurable: true
//            });
//        })
//    },
//    enumerable: true,
//    configurable: true
//});
//
//Person = {a:'a1', b: 'b1'}