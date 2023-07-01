// MIT

// --------------------------------------------------------------------------------
// new-event-polyfill v1.0.1 - Raphael Hättich
// git+https://github.com/RaphaelHaettich/new-event-polyfill.git
// --------------------------------------------------------------------------------

(function () {
    if (typeof window.Event === 'function')
        return false; // Polyfill unneeded

    function Event(event, params) {
        params = params || {
            bubbles: false,
            cancelable: false,
            composed: false
        };

        var evt = document.createEvent('Event');
        evt.initEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    Event.prototype = window.Event.prototype;
    window.Event = Event; // Expose to window

    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function (callback, thisArg) {
            thisArg = thisArg || window;
            for (var i = 0; i < this.length; i++) {
                callback.call(thisArg, this[i], i, this);
            }
        };
    }

    if (typeof Object.assign !== 'function') {
      // Must be writable: true, enumerable: false, configurable: true
      Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
          'use strict';
          if (target === null || target === undefined) {
            throw new TypeError('Cannot convert undefined or null to object');
          }

          var to = Object(target);

          for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null && nextSource !== undefined) {
              for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                  to[nextKey] = nextSource[nextKey];
                }
              }
            }
          }
          return to;
        },
        writable: true,
        configurable: true
      });
    }
}());

/* ====================
MVカルーセル
==================== */
(function () {
    'use strict';

    const FOCUSABLE = 'a, area, input, button, select, option, textarea, output, summary, video, audio, object, embed, iframe';

    /**
     * カルーセル機能
     * @constructor
     * @param {object} root カルーセル本体
     * @param {object} options インスタンス生成時に設定したオプション
     */
    const Carousel = function (root, options) {
        if (!(this instanceof Carousel)) {
            return new Carousel(root, options);
        }

        const self = this;
        const o = {
            wrap: 'carousel-wrap',
            slideWrap: 'carousel-slide-wrap',
            slideInner: 'carousel-slide-inner',
            item: 'carousel-item',
            nextClass: 'carousel-next',
            prevClass: 'carousel-prev',
            playerWrapClass: 'carousel-player-wrap',
            indicatorWrapClass: 'carousel-indicator-wrap',
            indicatorClass: 'carousel-indicator',
            playClass: 'carousel-play',
            pauseClass: 'carousel-pause',
            autoPlayHookClass: 'carousel-play-hook',
            easing: 'ease',
            autoPlay: false,
            onStopPlay: false,
            swipe: true,
            dots: true,
            spColumn: null,
            colMargin: null,
            column: 1,
            breakPoint: 767,
            playInterval: 5000,
            resizeThreshold: 200,
            duration: 500
        };

        Object.assign(o, options);

        // DOMオブジェクト
        this.root = root;
        this.slideWrap = root.querySelector('.' + o.slideWrap);
        this.slideInner = root.querySelector('.' + o.slideInner);
        this.wrap = root.querySelector('.' + o.wrap);
        this.item = root.querySelectorAll('.' + o.item);
        this.itemLength = this.item.length;
        this.focusableItem = [];
        this.item.forEach(function (el) {
            let i = 0;
            let targets = el.querySelectorAll(FOCUSABLE);

            for (; i < targets.length; i++) {
                self.focusableItem.push(targets[i]);
            }
        });

        // DOMの生成
        this.nextButton = document.createElement('button');
        this.prevButton = document.createElement('button');
        this.playerWrap = document.createElement('div');
        this.indicatorWrap = document.createElement('ul');
        this.playButton = document.createElement('button');
        this.pauseButton = document.createElement('button');

        // class名
        this.nextClass = o.nextClass;
        this.prevClass = o.prevClass;
        this.playClass = o.playClass;
        this.pauseClass = o.pauseClass;
        this.autoPlayHookClass = o.autoPlayHookClass;
        this.indicatorWrapClass = o.indicatorWrapClass;
        this.playerWrapClass = o.playerWrapClass;
        this.itemClass = o.item;
        this.indicatorClass = o.indicatorClass;

        // オプションの設定
        this.dots = o.dots;
        this.column = o.column;
        this.colMargin = o.colMargin;
        this.defalutMargin = o.colMargin;
        this.defalutColumn = o.column;
        this.spColumn = o.spColumn;
        this.playInterval = o.playInterval;
        this.autoPlay = o.autoPlay;
        this.onStopPlay = o.onStopPlay;
        this.easing = o.easing;
        this.swipe = o.swipe;
        this.breakPoint = o.breakPoint;
        this.animationType = o.animationType;
        this.resizeThreshold = o.resizeThreshold;
        this.duration = o.duration;

        // 動的に代入される設定
        this.indicator = null;
        this.cloneBeforeWrap = null;
        this.cloneAfterWrap = null;
        this.cloneBeforeItem = null;
        this.cloneAfterItem = null;
        this.autoPlayId = null;
        this.resizeBeforeWidth = null;
        this.resizeAfterWidth = null;
        this.isAutoPlay = false;
        this.isSliding = false;
        this.isOnStop = null;
        this.itemWidth = null;

        // カルーセルの初期配置設定
        this.nowPosition = 0;
        this.isCurrentNum = 1;
        if (this.animationType === 'fade') {
            this.column = 1;
        }

        // 機能実行
        this.addElementAndClasses();
        this.setInitItems();
        this.setController();
        this.changeTabIndex();
        this.clickEvent();
        this.resizeEvent();
        this.hoverEvent();
        this.keyEvent();

        if (this.swipe) {
            this.swipeEvent();
        }

        if (this.autoPlay) {
            this.startAutoPlay();
        }

        this.forcedResize();
    };

    Carousel.prototype = {
        /**
         * DOM要素の追加生成と属性の付与
         * @returns {void}
         */
        addElementAndClasses: function () {
            const addSpan = function (el, cl, txt) {
                const span = document.createElement('span');
                let i = 0;

                for (; i < cl.length; i++) {
                    el.classList.add(cl[i]);
                }

                el.setAttribute('type', 'button');
                el.appendChild(span);
                span.textContent = txt;
            };

            addSpan(this.nextButton, [this.nextClass], 'next');
            addSpan(this.prevButton, [this.prevClass], 'prev');
            this.playerWrap.classList.add(this.playerWrapClass);
            this.indicatorWrap.classList.add(this.indicatorWrapClass);

            if (this.autoPlay) {
                addSpan(this.playButton, [this.playClass, this.autoPlayHookClass], 'start autoplay');
                addSpan(this.pauseButton, [this.pauseClass, this.autoPlayHookClass], 'stop autoplay');
            }
        },

        /**
         * カルーセルアイテムの初期配置
         * @returns {void}
         */
        setInitItems: function () {
            const self = this;

            self.wrap.style.position = 'absolute';
            self.wrap.style.top = 0;
            self.item.forEach(function (el) {
                el.style.position = 'absolute';
            });

            if (self.itemLength === 1) {
                self.column = 1;
            }

            if (self.colMargin && self.column > 1) {
                self.item.forEach(function (el) {
                    el.style.marginRight = self.colMargin + 'px';
                });
            }

            const _self = this;
            _self.item.forEach(function (el, num) {
                const styles = el.style;

                styles.top = 0;
                styles.left = 0;
                styles.opacity = 0;
                styles.zIndex = 0;
                styles.transitionDuration = '0s';
                styles.transitionTimingFunction = _self.easing;
                styles.transitionProperty = 'opacity';

                if (num === 0) {
                    el.style.opacity = 1;
                    el.style.zIndex = 1;
                }
            });

            setTimeout(function() {
                _self.item.forEach(function (el) {
                    el.style.transitionDuration = (_self.duration / 1000) + 's';
                });
            }, 10);
        },

        /**
         * スライド操作に必要な要素の配置
         * @returns {void}
         */
        setController: function () {
            let fragment = document.createDocumentFragment();
            let i = 0;

            // インジケーターの生成
            for (; i < this.itemLength; i++) {
                const li = document.createElement('li');
                const button = document.createElement('button');
                const span = document.createElement('span');

                button.classList.add(this.indicatorClass);
                button.setAttribute('type', 'button');
                span.classList.add('indicator-index');
                span.setAttribute('data-current', i + 1);
                span.textContent = (i + 1);
                button.appendChild(span);
                li.appendChild(button);
                fragment.appendChild(li);
            }

            // 各種要素の配置
            // this.root.appendChild(this.nextButton);
            // this.root.insertBefore(this.prevButton, this.root.firstChild);
            this.root.appendChild(this.playerWrap);
            this.indicatorWrap.appendChild(fragment);
            this.playerWrap.appendChild(this.indicatorWrap);

            if (this.autoPlay) {
                this.playerWrap.appendChild(this.pauseButton);
                this.isAutoPlay = true;
            }

            // this.playerWrap.prepend(this.prevButton)
            this.playerWrap.insertBefore(this.prevButton, this.playerWrap.firstElementChild)
            this.playerWrap.appendChild(this.nextButton)

            // class名の付与
            this.indicator = this.indicatorWrap.querySelectorAll('.' + this.indicatorClass);
            this.indicator[0].classList.add('is-active');
        },

        /**
         * 一つ先にスライドする処理
         * @return {void}
         */
        nextSlide: function () {
            this.isSliding = true;
            this.isCurrentNum++;
            this.resizeBeforeWidth = window.innerWidth;
            this.item[this.isCurrentNum - 2].style.opacity = 0;
            this.item[this.isCurrentNum - 2].style.zIndex = 0;

            if (this.isCurrentNum <= this.itemLength) {
                this.item[this.isCurrentNum - 1].style.opacity = 1;
                this.item[this.isCurrentNum - 1].style.zIndex = 1;
            }

            if (this.isCurrentNum === this.itemLength + 1) {
                this.item[this.isCurrentNum - 2].style.opacity = 0;
                this.item[this.isCurrentNum - 2].style.zIndex = 0;
                this.item[0].style.opacity = 1;
                this.item[0].style.zIndex = 1;
                this.indicatorUpdate(0);
                this.isCurrentNum = 1;

                return;
            }

            // インジケーター同期
            this.indicatorUpdate(this.isCurrentNum - 1);
        },

        /**
         * 一つ前にスライドする処理
         * @return {void}
         */
        prevSlide: function () {
            this.isSliding = true;
            this.isCurrentNum--;
            this.resizeBeforeWidth = window.innerWidth;

            if (this.isCurrentNum === 0) {
                this.item[0].style.opacity = 0;
                this.item[0].style.zIndex = 0;
                this.item[this.itemLength - 1].style.opacity = 1;
                this.item[this.itemLength - 1].style.zIndex = 1;
                this.isCurrentNum = this.itemLength;
            } else {
                this.item[this.isCurrentNum].style.opacity = 0;
                this.item[this.isCurrentNum].style.zIndex = 0;
                this.item[this.isCurrentNum - 1].style.opacity = 1;
                this.item[this.isCurrentNum - 1].style.zIndex = 1;
            }

            // インジケーター同期
            if (this.isCurrentNum === 0) {
                this.indicatorUpdate(this.itemLength - 1);
            } else {
                this.indicatorUpdate(this.isCurrentNum - 1);
            }
        },

        /**
         * 任意の箇所にスライドする処理
         * @param {object} e - クリックされたインジケーター
         * @return {void}
         */
        targetSlide: function (e) {
            const targetNum = e.target.querySelector('.indicator-index').getAttribute('data-current');

            this.isSliding = true;
            this.resizeBeforeWidth = window.innerWidth;
            this.indicatorUpdate(targetNum - 1);
            this.isCurrentNum = parseInt(targetNum, 10);
            this.item.forEach(function (el) {
                el.style.opacity = 0;
                el.style.zIndex = 0;
            });
            this.item[this.isCurrentNum - 1].style.opacity = 1;
            this.item[this.isCurrentNum - 1].style.zIndex = 1;
        },

        /**
         * スライド時のタブインデックス操作
         * @return {void}
         */
        changeTabIndex: function () {
            const self = this;
            const setTabIndex = function (target, addNum) {
                const changeTarget = self.item[target].querySelectorAll(FOCUSABLE);

                changeTarget.forEach(function (el) {
                    el.tabIndex = addNum;
                });
            };
            const setCloneTabIndex = function (target, addNum) {
                const changeTarget = self.cloneAfterItem[target].querySelectorAll(FOCUSABLE);

                changeTarget.forEach(function (el) {
                    el.tabIndex = addNum;
                });
            };

            self.focusableItem.forEach(function (el) {
                el.tabIndex = -1;
            });

            switch (self.column) {
            case 1:
                if (self.isCurrentNum === self.itemLength + 1) {
                    setTabIndex(0, 0);

                    return;
                }

                if (self.isCurrentNum === 0) {
                    setTabIndex(self.itemLength - 1, 0);

                    return;
                }

                setTabIndex(self.isCurrentNum - 1, 0);
                break;

            case 2:
                // 最初のアイテムにカレント時
                if (self.isCurrentNum === 0) {
                    setTabIndex(self.itemLength - 1, 0);
                    setCloneTabIndex(0, 0);

                    return;
                }

                // 最後から二番目のアイテムにカレント時
                if (self.isCurrentNum === self.itemLength) {
                    setTabIndex(self.isCurrentNum - 1, 0);
                    setCloneTabIndex(0, 0);

                    return;
                }

                // 最後のアイテムにカレント時
                if (self.isCurrentNum === self.itemLength + 1) {
                    setTabIndex(0, 0);
                    setTabIndex(1, 0);

                    return;
                }

                setTabIndex(self.isCurrentNum - 1, 0);
                setTabIndex(self.isCurrentNum, 0);
                break;

            case 3:
                // 最初のアイテムにカレント時
                if (self.isCurrentNum === 0) {
                    setTabIndex(self.itemLength - 1, 0);
                    setCloneTabIndex(0, 0);
                    setCloneTabIndex(1, 0);

                    return;
                }

                // 最後から三番目のアイテムにカレント時
                if (self.isCurrentNum === self.itemLength - 1) {
                    setTabIndex(self.isCurrentNum, 0);
                    setTabIndex(self.isCurrentNum - 1, 0);
                    setCloneTabIndex(0, 0);

                    return;
                }

                // 最後から二番目のアイテムにカレント時
                if (self.isCurrentNum === self.itemLength) {
                    setTabIndex(self.isCurrentNum - 1, 0);
                    setCloneTabIndex(0, 0);
                    setCloneTabIndex(1, 0);

                    return;
                }

                // 最後のアイテムにカレント時
                if (self.isCurrentNum === self.itemLength + 1) {
                    setTabIndex(0, 0);
                    setTabIndex(1, 0);
                    setTabIndex(2, 0);

                    return;
                }

                setTabIndex(self.isCurrentNum - 1, 0);
                setTabIndex(self.isCurrentNum, 0);
                setTabIndex(self.isCurrentNum + 1, 0);
                break;

            default:
                break;
            }
        },

        /**
         * マウスクリック時の処理
         * @return {void}
         */
        clickEvent: function () {
            const self = this;

            self.nextButton.addEventListener('click', function () {
                self.nextSlide();
                self.changeTabIndex();
                if (self.autoPlay && self.isAutoPlay) {
                    self.resetAutoPlayTime();
                }
            });

            self.prevButton.addEventListener('click', function () {
                self.prevSlide();
                self.focusableItem.forEach(function (el) {
                    el.tabIndex = -1;
                });
                self.changeTabIndex();
                if (self.autoPlay && self.isAutoPlay) {
                    self.resetAutoPlayTime();
                }
            });

            self.indicator.forEach(function (el) {
                el.addEventListener('click', function (e) {
                    if (e.target.classList.contains('is-active')) {
                        return;
                    }

                    self.targetSlide(e);
                    self.changeTabIndex();
                    if (self.autoPlay && self.isAutoPlay) {
                        self.resetAutoPlayTime();
                    }
                });
            });

            self.slideInner.addEventListener('transitionend', function () {
                self.transitionAfter();
            });

            self.item.forEach(function (el) {
                el.addEventListener('transitionend', function () {
                    self.isSliding = false;
                });
            });

            self.pauseButton.addEventListener('click', function (e) {
                if (e.target.classList.contains(self.pauseClass)) {
                    self.stopAutoPlay();
                } else {
                    self.startAutoPlay();
                }
                self.changeAutoPlayIcon(e);
            });
        },

        /**
         * リサイズ時の処理
         * @return {void}
         */
        resizeEvent: function () {
            const self = this;
            let timeoutId = 0;
            let windowWidth = 0;

            window.addEventListener('resize', function () {
                if (timeoutId) {
                    return;
                }

                timeoutId = setTimeout(function () {
                    timeoutId = 0;
                    windowWidth = window.innerWidth;

                    if (self.spColumn) {
                        self.changeBreakPoint(windowWidth);
                    }
                }, self.resizeThreshold);
            }, false);
        },

        /**
         * マウスホバー時の処理
         * @return {void}
         */
        hoverEvent: function () {
            const self = this;

            self.item.forEach(function (el) {
                el.addEventListener('mouseenter', function () {
                    if (self.autoPlay && self.onStopPlay && self.isAutoPlay) {
                        self.stopAutoPlay();
                        self.isOnStop = true;
                    }
                }, false);

                el.addEventListener('mouseleave', function () {
                    if (self.autoPlay && self.onStopPlay && self.isOnStop) {
                        self.startAutoPlay();
                        self.isOnStop = false;
                    }
                }, false);
            });
        },

        /**
         * キー操作時の処理
         * @return {void}
         */
        keyEvent: function () {
            const self = this;
            const tabEventCansel = function (e) {
            };

            self.nextButton.addEventListener('keydown', tabEventCansel);
            self.prevButton.addEventListener('keydown', tabEventCansel);
        },

        /**
         * スワイプ時の処理
         * @returns {void}
         */
        swipeEvent: function () {
            const self = this;
            const touchMargin = 30;
            let touchOnX = null;
            let touchOutX = null;

            self.root.addEventListener('touchstart', function (e) {
                touchOnX = e.changedTouches[0].pageX;
            }, {passive: true});

            self.root.addEventListener('touchend', function (e) {
                touchOutX = e.changedTouches[0].pageX;

                if (touchOnX + touchMargin < touchOutX) {
                    self.prevSlide();
                    self.changeTabIndex();
                    self.resetAutoPlayTime();
                } else if (touchOutX + touchMargin < touchOnX) {
                    self.nextSlide();
                    self.changeTabIndex();
                    self.resetAutoPlayTime();
                }
            }, {passive: true});
        },


        /**
         * トランジションアニメーション終了時の処理
         * @return {void}
         */
        transitionAfter: function () {
            const styles = window.getComputedStyle(this.slideInner);
        },

        /**
         * 初回読み込み時にトリガーイベントの強制発生
         * @returns {void}
         */
        forcedResize: function () {
            const resize = new Event('resize');

            window.dispatchEvent(resize);
        },

        /**
         * ブレイクポイントのカラム切替処理
         * @param {number} width - リサイズ時のウィンドウ幅
         * @return {void}
         */
        changeBreakPoint: function (width) {
            if (width < this.breakPoint) {
                this.column = this.spColumn;
                if (this.spColumn === 1) {
                    this.colMargin = 0;
                }
            } else {
                this.column = this.defalutColumn;
                this.colMargin = this.defalutMargin;
            }
        },

        /**
         * インジケーターのカレント同期
         * @param {number} currentTarget カレントをアクティブにしたい数値
         * @return {void}
         */
        indicatorUpdate: function (currentTarget) {
            this.indicator.forEach(function (el) {
                el.classList.remove('is-active');
            });
            this.indicator[currentTarget].classList.add('is-active');
        },

        /**
         * 自動再生開始機能
         * @return {void}
         */
        startAutoPlay: function () {
            const self = this;

            self.isAutoPlay = true;
            self.autoPlayId = setInterval(function () {
                self.nextSlide();
                self.changeTabIndex();
            }, self.playInterval);
        },

        /**
         * 自動再生停止機能
         * @return {void}
         */
        stopAutoPlay: function () {
            this.isAutoPlay = false;
            clearInterval(this.autoPlayId);
        },

        /**
         * 自動再生タイミングリセット機能
         * @return {void}
         */
        resetAutoPlayTime: function () {
            if (this.autoPlay && this.isAutoPlay) {
                const self = this;
                const resetAutoPlay = function () {
                    return new Promise(function (resolve) {
                        self.stopAutoPlay();
                        resolve();
                    });
                };

                resetAutoPlay().then(function () {
                    self.startAutoPlay();
                });
            }
        },

        /**
         * 自動再生アイコンの変更処理
         * @param {object} e - 自動再生切替ボタン
         * @return {void}
         */
        changeAutoPlayIcon: function (e) {
            const target = e.currentTarget;

            if (target.classList.contains(this.pauseClass)) {
                target.classList.remove(this.pauseClass);
                target.classList.add(this.playClass);
                target.querySelector('span').textContent = 'start autoplay';
            } else {
                target.classList.remove(this.playClass);
                target.classList.add(this.pauseClass);
                target.querySelector('span').textContent = 'stop autoplay';
            }
        },
    };

    document.querySelectorAll('.js-carousel').forEach(function (el) {
        Carousel(el, {
            playInterval: 10000,
            autoPlay: true,
            duration: 1000
        });
    });
}());

/* ====================
MVカルーセル内からのグロナビ開閉
==================== */
(function () {
    'use strict';

    var $btnGlobalMenu = $('body').find('.btn-menu-global');
    var $hook = $('body').find('.js-btn-menu-global-other');
    var click = new Event('click');

    if ($hook.length === 0 || $btnGlobalMenu === 0) {
        return;
    }

    $hook.on('click', function () {
        $btnGlobalMenu[0].dispatchEvent(click);
    })
}());

/* ====================
動画モーダル表示
==================== */
(function () {
    var $body = $('body');
    var $root = $body.find('.js-carousel-movie');
    var focusable = 'a, button, input, textarea, select, [tabindex]';

    if ($root.length === 0) {
        return;
    }

    $root.each(function (index) {
        var $selfWrapper = $(this);
        var $targetTrigger = $selfWrapper.find('.js-carousel-movie-hook');
        var $targetMovieFrame = $selfWrapper.find('.box-movie-frame');
        var $clonedTargetMovieFrame;
        var $movieFrameInner;
        var $btnModalClose;

        //  初期処理
        //  属性設定
        $targetTrigger.attr({
            tabindex: '0',
            'data-modal-movie-id': 'js-movie' + (index + 1)
        });

        //  クローン生成
        $targetMovieFrame.wrap('<div class="js-box-modal" id="js-movie' + (index + 1) + '"><div class="js-box-modal-inner">');
        $clonedTargetMovieFrame = $selfWrapper.find('.js-box-modal').addClass('cloned').clone(true);
        $selfWrapper.find('.js-box-modal').remove();
        $body.append($clonedTargetMovieFrame);

        $targetTrigger.on('click.openMovieModal', function () {
            var $selfTrigger = $(this);
            var targetId = '#' + $selfTrigger.data('modal-movie-id');
            var $movieFrame = $body.find('.js-box-modal');
            var $moviePlayer = $movieFrame.find('iframe');

            duration = 400;
            $movieFrame = $movieFrame.filter(targetId);
            $body.find(focusable).attr('tabindex', '-1');

            //  動的に生成する要素
            $movieFrameInner = $movieFrame.find('.js-box-modal-inner');
            $movieFrameInner.append('<button type="button" class="js-btn-modal-close">close</button>');
            $btnModalClose = $movieFrameInner.find('.js-btn-modal-close');

            //  モーダル展開
            $movieFrame.addClass('open').fadeIn(duration, function () {
                $movieFrame.find(focusable).attr('tabindex', '0');
            });

            $btnModalClose.on('click.closeMovieModal', function () {
                $movieFrame.fadeOut(duration);
                $body.find(focusable).removeAttr('tabindex');

                $body.find('.js-carousel-movie-hook').attr('tabindex', '0');
                $body.find('.js-carousel-movie-hook[data-modal-movie-id="' + $movieFrame.attr('id') + '"]').focus();

                // 一時停止
                $moviePlayer.each(function () {
                    var player = $(this)[0].contentWindow;

                    player.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                });

                $btnModalClose.off('click.closeMovieModal').remove();
            });
        });

        $targetTrigger.on('focus.focusInModal', function () {
            $(this).on('keypress.openMovieModalEnter', function (e) {
                if (e.keyCode === 13) {
                    $(this).trigger('click.openMovieModal');
                }
            });
        });
    });
}());
