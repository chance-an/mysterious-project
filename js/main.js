/**
 * User: anch
 * Date: 8/7/12
 * Time: 12:52 AM
 */

/*global
    APP: false
 */

var APP = (function(APP){
    'use strict';

    var count = 120;
    var fps = 10;

    function initialize(){
        var animation = new APP.Animation({
            videoSources: [
//                {type: 'video/ogg', src: 'video/combine.theora.ogv'},
                {type: 'video/webm', src: 'video/combine.webmvp8.webm'},
                {type: 'video/mp4', src: 'video/combine.mp4'}
            ],

            target: 'body > header canvas'
        });

        bindEvents();

        APP.POSTS.initialize();
    }

    function bindEvents(){
        Crystal.bindEvents();
    }

    $(document).ready(initialize);

    var Animation = (function(){

        var CHECK_INTERVAL = 500;

        function Animation(options){
            options = _.extend({
                videoSources: [],
                target: null
            }, options || {});
            this.options = options;

            if( !this.checkPrerequisite() ){
                throw 'invalid parameters';
            }

            this._loaded = $.Deferred();
            this._$video = null;
            this._$target = $(this.options.target);
            this.videoWidth = 0;
            this.videoHeight = 0;

            $(document).ready(_.bind(this._setup, this));
        }

        _.extend(Animation.prototype, {
            checkPrerequisite: function(){
                if(this.options.videoSources.length === 0){
                    return false;
                }
                var checkFailed = false;
                for(var i = 0; i < this.options.videoSources.length ; i++){
                    var e = this.options.videoSources[i];
                    if(!e.type || !e.src){
                        checkFailed = true;
                        break;
                    }
                }
                if( checkFailed ){
                    return false;
                }
                return $(this.options.target).is('canvas');
            },

            _setup: function(){
                //create video element
                var $video = $('<video/>');
                _.each(this.options.videoSources, function(e){
                    $('<source/>').attr({ type: e.type,src: e.src }).appendTo($video);
                });

                this._$video = $video;
                $video.on('loadedmetadata', _.bind(this._onMetaDataReady, this));
                $video.insertBefore($(this.options.target)).hide();

                this._$buffer = $('<canvas/>').insertBefore($(this.options.target)).hide();
            },

            _onMetaDataReady: function(){
                var $video = this._$video;
                var video = $video[0];

                //retrieve video dimension
                this.videoWidth = this._$video.prop('videoWidth');
                this.videoHeight = this._$video.prop('videoHeight');

                this._$buffer.attr({
                    'width': this.videoWidth,
                    'height': this.videoHeight
                });

                /* resolve compatibility issues for loop support */
                if(typeof video.loop === 'boolean'){
                    video.loop = true;
                }else{
                    // loop property not supported
                    $video.on('ended', function () {
                        video.currentTime = 0;
                        video.play();
                    });
                }

                this._checkLoaded();
                this._play();
            },

            _checkLoaded: function(){
                var $video = this._$video;
                var videoDuration = $video.prop('duration');
                var timer = setInterval(_.bind(function(){
                    var readyState = $video.prop('readyState');
                    if(readyState > 1 && $video.prop("buffered").length > 0){ // 1 = HTMLMediaElement.HAVE_METADATA
                        var buffered = $video.prop("buffered").end(0);
                        //If finished buffering quit calling it
                        if (buffered >= videoDuration) {
                            clearInterval(timer);
                            this._loaded.resolve(); //signal deferred object
                        }
                    }
                }, this), CHECK_INTERVAL);
            },

            _play: function(){
                var targetWidth = this._$target.width();
                var targetHeight = this._$target.height();
                var bufferContext = this._$buffer[0].getContext("2d");
                var video = this._$video[0];
                var width = this.videoWidth;
                var height = Math.floor(this.videoHeight / 2);

                var canvasContext = this._$target[0].getContext("2d");

                var ratioHorizontal = targetWidth / width;
                var ratioVertical = targetHeight / height;
                var renderFunction;

                //if the dimension of the target area doesn't match the buffer size, scaling approach needed to be used
                if( ratioHorizontal  !== 1 || ratioVertical !== 1){
                    renderFunction = function(imageData){
                        var scaleCanvas = $("<canvas/>")
                            .attr("width", width)
                            .attr("height", height)[0];

                        var scaleCanvasContext = scaleCanvas.getContext("2d");
                        scaleCanvasContext.putImageData(imageData, 0, 0, 0, 0, width, height);
                        canvasContext.clearRect ( 0, 0, targetWidth, targetHeight);
                        canvasContext.drawImage(scaleCanvas, 0, 0);
                    };
                }else{
                    renderFunction = function(imageData){
                        canvasContext.putImageData(imageData, 0, 0, 0, 0, width, height);
                    };
                }
                this._$target[0].getContext("2d").scale(ratioHorizontal, ratioVertical);

                var playFrame = _.bind(function (){
                    if(!this._detectVisible()){
                        return;
                    }

                    bufferContext.drawImage(video, 0, 0);

                    var image = bufferContext.getImageData(0, 0, width, height),
                        imageData = image.data,
                        alphaData = bufferContext.getImageData(0, height, width, height).data;

                    for (var i = 3, len = imageData.length; i < len; i = i + 4) {
                        imageData[i] = alphaData[i-1];
                    }
                    renderFunction(image);
                }, this);

                video.play(); //play the video, and the video will start loading only the data
                // for the current and near-future frames
                setInterval(playFrame, 40);
            },

            _detectVisible: function(){
                var video = this._$video[0];

                if ( video.paused ){
                    return false
                }

                if( video.readyState <= 1){  // 1 = HTMLMediaElement.HAVE_METADATA
                    //this includes 0 = HAVE_NOTHING ; 1 = HTMLMediaElement.HAVE_METADATA
                    //which means the video is probably buffering, so don't play a frame for such occasions
                    return false;
                }

                return true;
            }
        });
        return Animation;
    })();

    var UI = (function(){

        return {
            getViewportSize: function(){
                return {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight

                }
            },

            getViewportCenter: function(){
                return {
                    x : document.documentElement.clientWidth / 2,
                    y : document.documentElement.clientHeight / 2
                }
            },

            getTemplateByName: function(name){
                return $('script#template-' + name).html();
            }
        }
    })();

    var Crystal = function(){
        var STATES = {
            'fixed': {
                id : 'fixed',
                isLayoutChanged: function(){
                    var $mainContainer = $('#main-container');
                    var $crystal = $('#crystal');
                    var viewportSize = APP.UI.getViewportSize();
                    var scrollPositionLimit = $mainContainer.offset().top + $crystal.height() / 2 -
                        viewportSize.height / 2;

                    return $(document).scrollTop() < scrollPositionLimit;
                },

                changeTo: function(){
                    var $crystal = $('.crystal-wrapper');
                    $crystal.css({
                        position: 'fixed',
                        top: APP.UI.getViewportSize().height / 2 - $crystal.height() / 2
                    })
                }
            },

            'static' : {
                id : 'static',
                isLayoutChanged: function(){
                    var scrollPosition = $(document).scrollTop();
                    var $crystal = $('#crystal');

                    var viewportSize = APP.UI.getViewportSize();
                    var yCrystalCenter = $crystal.offset().top + $crystal.height() / 2;
                    var scrollPositionLimit = yCrystalCenter - viewportSize.height / 2;

                    return scrollPosition > scrollPositionLimit;
                },

                changeTo: function(){
                    var $crystal = $('.crystal-wrapper');
                    $crystal.css({
                        position: 'absolute',
                        top: 0
                    });
                }
            }
        };

        var state = STATES.static;

        function positionCrystal(){
            if(state.isLayoutChanged()){
                state = state === STATES.fixed ? STATES.static : STATES.fixed;
                state.changeTo();
            }
        }

        function bindEvents(){
            $(window).on('scroll', _.debounce(Crystal.positionCrystal, 10) );
        }

        function getArea(){
            var $crystal = $('#crystal');

            return {
                top: $crystal.offset().top,
                bottom: $crystal.offset().top + $crystal.height()
            }
        }


        return {
            positionCrystal : positionCrystal,
            bindEvents: bindEvents,
            getArea: getArea
        }
    }();

    return _.extend(APP, {
        Crystal: Crystal,
        UI: UI,
        Animation: Animation

    });
}(APP || {}));
