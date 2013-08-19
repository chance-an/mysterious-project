define(['backbone', 'APP/models/post_model'],
function(Backbone, PostModel){
    'use strict';

    /**
     * @export
     */
    return Backbone.Collection.extend({
        model: PostModel,
        url: 'data/posts.json'
    });
});