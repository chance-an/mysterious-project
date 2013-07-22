define(function(){
    'use strict';

    return {
        getViewportSize: function(){
            return {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight

            };
        },

        getViewportCenter: function(){
            return {
                x : document.documentElement.clientWidth / 2,
                y : document.documentElement.clientHeight / 2
            };
        },

        getTemplateByName: function(name){
            return $('script#template-' + name).html();
        }
    };
});