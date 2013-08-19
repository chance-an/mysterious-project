define(['backbone', 'APP/UI'],
function(Backbone, UI){
    'use strict';

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
                    left: location === 'left' ? $contourWrapper.width() - clippingSize : 0,
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

    var PostView = Backbone.View.extend({
        el : null,
        /**
         * @type {PostModel}
         */
        model : null,

        /**
         * @type {string}
         */
        lane: undefined,
        /**
         * @type {jQuery}
         */
        $lane: null,

        /**
         * @type {number}
         */
        tmpHeight: null,

        initialize: function(model){
            this.$el = null;
            this.model = model;
        },

        render: function(){
            var template = this._getViewTemplate();
            var $el = $(template(this.model.attributes));
            if(this.$el){
                this.$el.replaceWith($el);
            }else{
                this.$lane.append($el);
            }
            this.$el = $el;
            this.$el.height(this.tmpHeight);
            this.$el.data('model', this.model);
        },

        _getViewTemplate: function () {
            if (!_viewTemplate) {
                _viewTemplate = _.template(UI.getTemplateByName('post'));
            }
            return _viewTemplate;
        }
    });

    /**
     * @export
     */
    return Backbone.View.extend({
        el: null,
        _dimension: null,
        _collection: null,

        _$lanes: null,

        initialize: function(){
            this.$el = $('#post-list');
            this._$lanes = this.$el.find('.lane');
        },

        setCollection: function(collection){
            this._collection = collection;
            this._collection.each(function(post){
                post.view = new PostView(post);
            });
        },

        getCollection: function(){
            return this._collection;
        },

        render: function () {
            var self = this;
            this._collection.each(function(post, offset){
                self._assignPostViewParameters(post, offset);
            });

            this._collection.each(function(post){
                post.view.render();
            });
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

        /**
         * The parent view (PostsView) will arrange the layouts of the children views (PostView) comprehensively.
         *
         * @param post {PostModel}
         * @param offset {number}
         * @private
         */
        _assignPostViewParameters: function(post, offset){
            var postView = post.view;
            var laneId = offset % 2;
            postView.lane = ['left', 'right'][laneId];
            postView.$lane = $(this._$lanes[laneId]);

            postView.tmpHeight = _height_tmp; //TODO remove
            _height_tmp+=100;
        }
    });
});