/**
 * User: anch
 * Date: 1/24/13
 * Time: 12:40 AM
 */

define(['backbone', 'APP/app', 'APP/UI', 'APP/Crystal', 'APP/views/posts_view', 'APP/models/post_model', 'APP/collections/posts_collection'],
function(Backbone, APP, UI, Crystal, PostsView, PostModel, PostsCollection){
    'use strict';

    //----------------- Procedures ----------------------
    var _posts = new PostsCollection();
    var _view = new PostsView();

    function initialize() {
        var deferred = new $.Deferred();

        loadPost().pipe(function () {
            deploy(_posts);
        }).pipe(function () {
            bindEvents();
        });

        return deferred;
    }

    function loadPost() {
        var deferred = new $.Deferred();

        _posts.fetch({
            success: function() {
                deferred.resolve();
            },
            silent: true
        });
        return deferred;
    }

    function bindEvents() {
//        $(window).on('scroll', _.debounce(reshapePosts, 10));
    }

    function deploy(posts) {
        _view.setCollection(posts);
        _view.render();
    }

    function reshapePosts() {
        //reset all posts //TODO only reset previous changed ones
        _posts.each(function (post) {
            post.view.reset();
        });

        var $postList = $("#post-list");

        var lanesSelector = ['.lane:nth-child(1) .post', '.lane:nth-child(2) .post'];
        _.each(lanesSelector, function (laneSelector) {
            var $postsOnLane = $postList.find(laneSelector);

            blockContent($postsOnLane);

            var overlappedPostsIndexes = binarySearchForOverlap($postsOnLane, 0, $postsOnLane.length - 1);

            _.map(overlappedPostsIndexes, function (index) {
                var model = $($postsOnLane[index]).data('model');
                var renderingOption = calculateBlockedArea(model);
                model.view.update(renderingOption);
            });
        });
    }

    function binarySearchForOverlap($postElements, start, end) {
        var crystalBoundary = Crystal.getArea();

        if (start === end) {
            return _.filter([start], function (index) {
                return _isOverlap($postElements[index], crystalBoundary);
            });
        } else if (start + 1 === end) {
            return _.filter([start, end], function (index) {
                return _isOverlap($postElements[index], crystalBoundary);
            });
        }
        var middle = Math.floor(start + end) / 2;

        var middleElementBoundary = $($postElements[middle]).data('model').view.getDimension();
        if (middleElementBoundary.bottom < crystalBoundary.top) {
            // middle element is beneath the overlapping object, cut first half
            start = middle + 1;
            return binarySearchForOverlap($postElements, start, end);
        }

        if (middleElementBoundary.top > crystalBoundary.bottom) {
            // middle element is above the overlapping object, cut second half
            end = middle - 1;
            return binarySearchForOverlap($postElements, start, end);
        }

        //if overlaps the middle element, look both up and down to discover those also overlap
        var overlapped = [middle];

        //look up
        var pointer = middle;
        while (--pointer >= start) {
            if (_isOverlap($postElements[pointer], crystalBoundary)) {
                overlapped.unshift(pointer);
            }
        }

        //look down
        pointer = middle;
        while (++pointer <= end) {
            if (_isOverlap($postElements[pointer], crystalBoundary)) {
                overlapped.push(pointer);
            }
        }

        return overlapped;
    }

    function binarySearchFindFirstBlocked($postElements, start, end) {
        var crystalBoundary = Crystal.getArea();

        if (start === end) {
            if (_isOverlap($postElements[start], crystalBoundary)) {
                return start;
            }
            return null;
        } else if (start + 1 === end) {
            var blocked = _.filter([start, end], function (index) {
                return _isOverlap($postElements[index], crystalBoundary);
            }); // gets the blocked indexes, can be only 1-element array or empty
            return blocked[0]; //can be undefined
        }
        var middle = Math.floor(start + end) / 2;

        var middleElementBoundary = $($postElements[middle]).data('model').view.getDimension();
        if (middleElementBoundary.bottom < crystalBoundary.top) {
            // middle element is above the overlapping object, cut first half
            start = middle + 1;
            return binarySearchFindFirstBlocked($postElements, start, end);
        }

        if (middleElementBoundary.top > crystalBoundary.bottom) {
            // middle element is beneath the overlapping object, cut second half
            end = middle - 1;
            return binarySearchFindFirstBlocked($postElements, start, end);
        }

        //if overlaps the middle element, look up to discover the first blocked post
        var firstBlocked = middle;

        //look up
        var pointer = middle;
        while (--pointer >= start) {
            if (_isOverlap($postElements[pointer], crystalBoundary)) {
                firstBlocked = pointer;
            }
        }

        return firstBlocked;
    }

    function _isOverlap($postElement, overlappingElementDimension) {
        var elementBoundary = $($postElement).data('model').view.getDimension();
        return (elementBoundary.top <= overlappingElementDimension.bottom)
            && (elementBoundary.bottom >= overlappingElementDimension.top);
    }

    function calculateBlockedArea(model) {
        var result = {
            type: null,
            parameter: {}
        };
        var crystalBoundary = Crystal.getArea();
        var elementBoundary = model.view.getDimension();

        if (crystalBoundary.top <= elementBoundary.top && crystalBoundary.bottom >= elementBoundary.bottom) {
            result.type = 'full';
        } else if (crystalBoundary.top > elementBoundary.top && crystalBoundary.bottom < elementBoundary.bottom) {
            result.type = 'concave';
            result.parameter.topRemaining = crystalBoundary.top - elementBoundary.top;
            result.parameter.blocked = crystalBoundary.bottom - crystalBoundary.top;
            result.parameter.bottomRemaining = elementBoundary.bottom - crystalBoundary.bottom;
        } else if (crystalBoundary.bottom <= elementBoundary.bottom) {
            result.type = "top";
            result.parameter.blocked = crystalBoundary.bottom - elementBoundary.top;
            result.parameter.bottomRemaining = elementBoundary.bottom - crystalBoundary.bottom;
        } else if (crystalBoundary.top >= elementBoundary.top) {
            result.type = "bottom";
            result.parameter.topRemaining = crystalBoundary.top - elementBoundary.top;
            result.parameter.blocked = elementBoundary.bottom - crystalBoundary.top;
        }
        return result;
    }

    /**
     * Insert blocked element to post
     * @param $postList
     */
    function blockContent($postList) {
        var count = $postList.length;
        //first get the first blocked post from the top by binary search
        var firstBlocked = binarySearchFindFirstBlocked($postList, 0, count - 1);
        console.log(firstBlocked);

        var model = $($postList[firstBlocked]).data('model');
        model.view.reset();

        model.view.addBlocker();
    }

    return {
        initialize: initialize,
        PostModel: PostModel
    };
});
