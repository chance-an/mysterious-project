/**
 * User: anch
 * Date: 1/24/13
 * Time: 12:40 AM
 */

define(['APP/app', 'APP/UI', 'APP/Crystal'], function(APP, UI, Crystal){
    'use strict';
    //Classes
    var PostModel = Backbone.Model.extend({
        initialize: function () {
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

    var PostView = function () {
        var _viewTemplate = null;
        var _height_tmp = 100; //TODO remove and use natural length

        var _renderContourFunctions = {
            'full': function ($contourWrapper, renderParameter, location, clippingSize) {

                //full contour
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width() - clippingSize)
                    .css({
                        left: location === 'left' ? 0 : clippingSize,
                        border: '1px solid blue',
                        height: $contourWrapper.height()
                    }).appendTo($contourWrapper);

            },
            'top': function ($contourWrapper, renderParameter, location, clippingSize) {

                if (renderParameter.bottomRemaining < 15) {
                    _renderContourFunctions.full($contourWrapper, {}, location, clippingSize);
                    return;
                }

                if (renderParameter.blocked < 10) {
                    return;
                }

                //eclipsed
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width() - clippingSize)
                    .css({
                        left: location === 'left' ? 0 : clippingSize,
                        borderTop: '1px solid blue',
                        borderLeft: '1px solid blue',
                        borderRight: '1px solid blue',
                        borderBottom: '0px',
                        height: renderParameter.blocked
                    }).appendTo($contourWrapper);

                //remained
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width())
                    .css({
                        top: renderParameter.blocked,
                        borderTop: '0px solid blue',
                        borderLeft: '1px solid blue',
                        borderRight: '1px solid blue',
                        borderBottom: '1px solid blue',
                        height: renderParameter.bottomRemaining
                    }).appendTo($contourWrapper);

                //filling line
                $('<div/>').addClass('contour')
                    .width(clippingSize)
                    .css({
                        left: location == 'left' ? $contourWrapper.width() - clippingSize : 0,
                        top: renderParameter.blocked,
                        border: '1px solid blue',
                        height: 0
                    }).appendTo($contourWrapper);
            },
            'concave': function ($contourWrapper, renderParameter, location, clippingSize) {
                if (renderParameter.topRemaining < 15 && renderParameter.bottomRemaining < 15) {
                    _renderContourFunctions['full']($contourWrapper, {}, location, clippingSize);
                    return;
                }
                if (renderParameter.topRemaining < 15) {
                    _renderContourFunctions['top']($contourWrapper, {
                        blocked: renderParameter.blocked + renderParameter.topRemaining,
                        bottomRemaining: renderParameter.bottomRemaining
                    }, location, clippingSize);
                    return;
                }
                if (renderParameter.bottomRemaining < 15) {
                    _renderContourFunctions['bottom']($contourWrapper, {
                        blocked: renderParameter.blocked + renderParameter.bottomRemaining,
                        topRemaining: renderParameter.topRemaining
                    }, location, clippingSize);
                    return;
                }

                // top remained
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width())
                    .css({
                        border: '1px solid blue',
                        borderBottom: '0',
                        height: renderParameter.topRemaining
                    }).appendTo($contourWrapper);

                //eclipsed
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width() - clippingSize)
                    .css({
                        top: renderParameter.topRemaining,
                        left: location === 'left' ? 0 : clippingSize,
                        border: '1px solid blue',
                        borderWidth: '0 1px',
                        height: renderParameter.blocked
                    }).appendTo($contourWrapper);

                // bottom remained
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width())
                    .css({
                        top: renderParameter.topRemaining + renderParameter.blocked,
                        border: '1px solid blue',
                        borderTop: '0',
                        height: renderParameter.bottomRemaining
                    }).appendTo($contourWrapper);

                //filling lines
                $('<div/>').addClass('contour')
                    .width(clippingSize)
                    .css({
                        left: location == 'left' ? $contourWrapper.width() - clippingSize : 0,
                        top: renderParameter.topRemaining,
                        border: '1px solid blue',
                        height: 0
                    }).appendTo($contourWrapper)
                    .clone().css({
                        top: renderParameter.topRemaining + renderParameter.blocked
                    }).appendTo($contourWrapper);

            },
            'bottom': function ($contourWrapper, renderParameter, location, clippingSize) {
                if (renderParameter.topRemaining < 15) {
                    _renderContourFunctions['full']($contourWrapper, {}, location, clippingSize);
                    return;
                }

                if (renderParameter.blocked < 10) {
                    return;
                }

                //remained
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width())
                    .css({
                        borderTop: '1px solid blue',
                        borderLeft: '1px solid blue',
                        borderRight: '1px solid blue',
                        borderBottom: '0px solid blue',
                        height: renderParameter.topRemaining
                    }).appendTo($contourWrapper);

                //eclipsed
                $('<div/>').addClass('contour')
                    .width($contourWrapper.width() - clippingSize)
                    .css({
                        top: renderParameter.topRemaining,
                        left: location === 'left' ? 0 : clippingSize,
                        borderTop: '0px solid blue',
                        borderLeft: '1px solid blue',
                        borderRight: '1px solid blue',
                        borderBottom: '1px solid blue',
                        height: renderParameter.blocked
                    }).appendTo($contourWrapper);

                //filling line
                $('<div/>').addClass('contour')
                    .width(clippingSize)
                    .css({
                        left: location == 'left' ? $contourWrapper.width() - clippingSize : 0,
                        top: renderParameter.topRemaining,
                        border: '1px solid blue',
                        height: 0
                    }).appendTo($contourWrapper);
            }
        };

        var _renderBlockerFunctions = {
            'full': function () {

            },

            top: function (parameters) {
                this.$el.prepend($('<div/>').css({
                    width: parameters.clippingSize,
                    height: parameters.blocked
                }).addClass('blocker'));
            },

            concave: function (parameters) {
                this.$el.prepend($('<div/>').css({
                    width: parameters.clippingSize,
                    height: parameters.blocked
                }).addClass('blocker'));

                this.$el.prepend($('<div/>').css({
                    width: 0,
                    height: parameters.topRemaining
                }).addClass('blocker'));
            },

            bottom: function () {

            }
        };

        return Backbone.View.extend({
            el: null,
            _dimension: null,

            render: function () {
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

            update: function (renderingParameter) {
                var $contourWrapper = this.$el.find('.contour-wrapper');
                $contourWrapper.empty();

                var crystalDimension = Crystal.getArea();
                var location, clippingSize;

                if ($contourWrapper.offset().left < crystalDimension.left) {
                    location = 'left';
                    clippingSize = $contourWrapper.offset().left + $contourWrapper.width() - crystalDimension.left;
                } else {
                    location = 'right';
                    clippingSize = crystalDimension.right - $contourWrapper.offset().left;
                }

                _renderContourFunctions[renderingParameter.type](
                    $contourWrapper, renderingParameter.parameter, location, clippingSize
                );

                this.$el.css('border-color', 'red'); //TODO refactor
            },

            addBlocker: function () {
                var renderingParameters = calculateBlockedArea(this.model);

                var crystalDimension = Crystal.getArea();
                var clippingSize;
                if (this.$el.offset().left < crystalDimension.left) {
                    clippingSize = this.$el.offset().left + this.$el.width() - crystalDimension.left;
                } else {
                    clippingSize = crystalDimension.right - this.$el.offset().left;
                }
                renderingParameters.parameter = _.extend(renderingParameters.parameter || {},
                    {clippingSize: clippingSize});

                _renderBlockerFunctions[renderingParameters.type].call(this,
                    renderingParameters.parameter);
            },

            reset: function () {
                this.$el.css('border-color', 'green'); //TODO refactor
                this.$el.find('.contour-wrapper').empty();
                this.$el.find('.blocker').remove();
            },

            getDimension: function () {
                if (!this._dimension) {
                    this._dimension = {
                        top: this.$el.offset().top,
                        bottom: this.$el.offset().top + this.$el.height()
                    };
                }
                return this._dimension;
            },

            _getViewTemplate: function () {
                if (!_viewTemplate) {
                    _viewTemplate = _.template(UI.getTemplateByName('post'));
                }
                return _viewTemplate;
            }
        });

    }();


    //----------------- Procedures ----------------------
    var _posts = new (Backbone.Collection.extend({
        model: PostModel
    }));

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

        (new (Backbone.Collection.extend({
            model: PostModel,
            url: 'data/posts.json'
        }))).fetch({
                success: function (collection) {
                    _posts.add(collection.models, {silent: true});
                    deferred.resolve();
                }
            });
        return deferred;
    }

    function bindEvents() {
        $(window).on('scroll', _.debounce(reshapePosts, 10));
    }

    function deploy(posts) {
        posts.each(function (post) {
            post.view.render();
        });
    }

    function reshapePosts() {
        //reset all posts //TODO only reset previous changed ones
        _posts.each(function (post) {
            post.view.reset();
        });

        var $postList = $("#post-list");

        var lanesSelector = ['.lane:nth-child(1) .post', '.lane:nth-child(2) .post'];
        _.each(lanesSelector, function (laneSelector) {
            var $lanePosts = $postList.find(laneSelector);

            blockContent($lanePosts);

            var overlappedPostsIndexes = binarySearchForOverlap($lanePosts, 0, $lanePosts.length - 1);

            _.map(overlappedPostsIndexes, function (index) {
                var model = $($lanePosts[index]).data('model');
                var renderingOption = calculateBlockedArea(model);
                model.view.update(renderingOption);
            });
        });
    }

    function binarySearchForOverlap($postElements, start, end) {
        var crystalBoundary = Crystal.getArea();

        if (start == end) {
            return _.filter([start], function (index) {
                return _isOverlap($postElements[index], crystalBoundary);
            });
        } else if (start + 1 == end) {
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

        var model = $($postList[firstBlocked]).data('model');
        model.view.reset();

        model.view.addBlocker();
    }

    return {
        initialize: initialize,
        PostModel: PostModel,
        PostView: PostView
    };
});
