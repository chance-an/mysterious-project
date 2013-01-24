/**
 * User: anch
 * Date: 1/24/13
 * Time: 12:40 AM
 */

var APP = (function(APP){
    var POSTS = function(){

        //Classes
        var PostModel = Backbone.Model.extend({
            initialize: function(){
                this.view = new PostView({
                    model: this
                });
            },

            defaults: {
                title: '',
                content: ''
            },

            view: null
        });


        var PostView = function(){
            var _viewTemplate = null;
            var _height_tmp = 100; //TODO remove and use natural length

            return Backbone.View.extend({
                el: null,
                _dimension: null,

                render: function(){
                    var $lanes = $("#post-list").find(".lane");
                    var offset = $lanes.children().length;

                    var template = this._getViewTemplate();
                    this.$el = $(template(this.model.attributes));
                    var $lane = $($lanes.get(offset % 2));

                    this.$el.height(_height_tmp);
                    _height_tmp += 100; //TODO remove
                    $lane.append(this.$el);
                    this.$el.data('model', this.model);
                },

                update: function(){
                    this.$el.css('border-color', 'red'); //TODO refactor
                },

                reset: function(){
                    this.$el.css('border-color', 'green'); //TODO refactor
                },

                getDimension: function(){
                    if(!this._dimension){
                        this._dimension = {
                            top: this.$el.offset().top,
                            bottom: this.$el.offset().top + this.$el.height()
                        }
                    }
                    return this._dimension;
                },

                _getViewTemplate: function(){
                    if( !_viewTemplate){
                        _viewTemplate = _.template(APP.UI.getTemplateByName('post'));
                    }
                    return _viewTemplate;
                }
            });
        }();

        //--------------------------------------------
        var _posts = new (Backbone.Collection.extend({
            model: PostModel
        }));

        function initialize(){
            var deferred = new $.Deferred();

            loadPost().pipe(function(){
                deploy(_posts);
            }).pipe(function(){
                bindEvents();
            });

            return deferred;
        }

        function loadPost(){
            var deferred = new $.Deferred();

            (new (Backbone.Collection.extend({
                model: PostModel,
                url: 'data/posts.json'
            }))).fetch({
                success: function(collection){
                    _posts.add(collection.models, {silent: true});
                    deferred.resolve();
                }
            });
            return deferred;
        }

        function bindEvents(){
            $(window).on('scroll', _.debounce(calculateOverlapped, 10) );
        }

        function deploy(posts){
            posts.each(function(post){
                post.view.render();
            });
        }

        function calculateOverlapped(){
            //reset all posts //TODO only reset previous changed ones
            _posts.each(function(post){
                post.view.reset();
            });

            var $postList = $("#post-list");
            var $leftLanePosts = $postList.find('.lane:first-child .post');
            var leftLaneLength = $leftLanePosts.length;
            var overlap = binarySearchForOverlap($leftLanePosts, 0, leftLaneLength - 1);

            _.map(overlap, function(index){
                $($leftLanePosts[index]).data('model').view.update();
            });

            var $rightLanePosts = $postList.find('.lane:last-child .post');
            var rightLaneLength = $rightLanePosts.length;
            overlap = binarySearchForOverlap($rightLanePosts, 0, rightLaneLength - 1);
            _.map(overlap, function(index){
                $($rightLanePosts[index]).data('model').view.update();
            });
        }

        function binarySearchForOverlap($postElements, start, end){
            var crystalBoundary = APP.Crystal.getOccupation();

            if(start == end){
                return _.filter([start], function(index){
                    return _isOverlap($postElements[index], crystalBoundary);
                });
            }else if(start + 1 == end){
                return _.filter([start, end], function(index){
                    return _isOverlap($postElements[index], crystalBoundary);
                });
            }
            var middle = Math.floor( start + end ) / 2;

            var middleElementBoundary = $($postElements[middle]).data('model').view.getDimension();
            if(middleElementBoundary.bottom < crystalBoundary.top){
                // middle element is beneath the overlapping object, cut first half
                start = middle + 1;
                return binarySearchForOverlap($postElements, start, end);
            }

            if(middleElementBoundary.top > crystalBoundary.bottom){
                // middle element is above the overlapping object, cut second half
                end = middle - 1;
                return binarySearchForOverlap($postElements, start, end);
            }

            //if overlaps the middle element, look both up and down to discover those also overlap
            var overlapped = [middle];

            //look up
            var pointer = middle;
            while(--pointer >= start){
                if(_isOverlap($postElements[pointer], crystalBoundary)){
                    overlapped.unshift(pointer);
                }
            }

            //look down
            pointer = middle;
            while(++pointer <= end){
                if(_isOverlap($postElements[pointer], crystalBoundary)){
                    overlapped.push(pointer);
                }
            }

            return overlapped;
        }

        function _isOverlap($postElement, overlappingElementDimension){
            var elementBoundary = $($postElement).data('model').view.getDimension();
            return (elementBoundary.top <= overlappingElementDimension.bottom)
                && (elementBoundary.bottom >= overlappingElementDimension.top);
        }

        return {
            initialize: initialize,

            PostModel : PostModel,
            PostView: PostView
        }
    }();


    return _.extend(APP, {
        POSTS: POSTS
    });
})(APP || {});
