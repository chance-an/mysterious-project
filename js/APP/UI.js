define(function(){
    'use strict';

    function getViewportSize(){
        return {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight

        };
    }

    return {
        getViewportSize: getViewportSize,

        getViewportCenter: function(){
            return {
                x : document.documentElement.clientWidth / 2,
                y : document.documentElement.clientHeight / 2
            };
        },

        getTemplateByName: function(name){
            return $('script#template-' + name).html();
        },

        initialize: function(){
            $('#main-container').width(getViewportSize().width);
        }
    };
});