define(['backbone'],
function(Backbone){
    'use strict';

    /**
     * @export
     */
    return Backbone.Model.extend({
        initialize: function () {},

        defaults: {
            title: '',
            content: ''
        },

        view: null
    });
});