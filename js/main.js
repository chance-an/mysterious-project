/**
 * User: anch
 * Date: 8/7/12
 * Time: 12:52 AM
 */

/*global
  requirejs: false
 */

'use strict';

requirejs.config({
    baseUrl : 'js',

    paths:{
        jquery : 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min',
        underscore : '3rd/underscore-min',
        backbone : 'http://backbonejs.org/backbone-min',
        'backbone-mvc' : '3rd/backbone-mvc'
    },

    shim: {
        'backbone-mvc': {
            deps: ['underscore', 'backbone', 'jquery']
        },

        backbone: {
            deps: ['underscore'],
            exports: 'Backbone'
        },

        'underscore': {
            exports: '_'
        }
    }
});


requirejs(['APP/app', 'APP/animation', 'APP/crystal', 'APP/posts'],
function(App, Animation, Crystal, Posts){


    function bindEvents(){
        Crystal.bindEvents();
    }

    function initialize(){
        App.animation = new Animation({
            videoSources: [
//                {type: 'video/ogg', src: 'video/combine.theora.ogv'},
                {type: 'video/webm', src: 'video/combine.webmvp8.webm'},
                {type: 'video/mp4', src: 'video/combine.mp4'}
            ],

            target: 'body > header canvas'
        });

        bindEvents();

        Posts.initialize();
    }

    $(document).ready(initialize);
});
