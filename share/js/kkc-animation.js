(function () {
    'use strict';

    var $win = $(window);
    var kkcAnimation = {
        data: {
            $animationEl: null,
            $scrollEl: null,
            winHeight: $win.outerHeight()
        },
        /**
         * 初期処理
         * @returns {Undefined} undefined
         */
        init: function () {
            this.fetchAnimationEl();

            if (this.existAnimationEl('all')) {
                this.setEvOfAnimationEl();

                if (this.existAnimationEl('scroll')) {
                    this.scrollEv();
                    this.setScrollEv($win);
                    this.setResizeEv($win);
                }
            }
        },
        /**
         * kkc-animeクラスが付加されている要素を検索しdataに代入する
         * @returns {Undefined} undefined
         */
        fetchAnimationEl: function () {
            this.data.$animationEl = $('[class*=kkc-anime]');
            this.data.$scrollEl = $('[class*=kkc-anime_scroll]');

            return undefined;
        },
        /**
         * kkc-animeクラスが付加されている要素が存在するか判定する
         * @param {String} type イベントタイプ（何も指定しない場合はallになる） => all: kkc-animeクラスが付加されている全要素, scroll: scrollイベントが付加されている要素
         * @returns {Boolean} boolean
         */
        existAnimationEl: function (_type) {
            var data = this.data;
            var type = _type || 'all';

            if (
                (type === 'all' && data.$animationEl.length) ||
                (type === 'scroll' && data.$scrollEl.length)
            ) {
                return true;
            }

            return false;
        },
        /**
         * $animationElにanimationstartイベントとanimationendイベントを設定する
         * @returns {Undefined} undefined
         */
        setEvOfAnimationEl: function () {
            var $animationEl = this.data.$animationEl;

            $animationEl.on('animationstart', this.animationStartEv);
            $animationEl.on('animationend', this.animationEndEv);

            return undefined;
        },
        /**
         * $animationElのanimationstartイベントとanimationendイベントを解除する
         * @returns {Undefined} undefined
         */
        unsetEvOfAnimationEl: function () {
            var $animationEl = this.data.$animationEl;

            $animationEl.off('animationstart', this.animationStartEv);
            $animationEl.off('animationend', this.animationEndEv);

            return undefined;
        },
        /**
         * アニメーションが始まった際に"kkc-anime_state_animation-start"クラスを追加
         * "kkc-anime_state_animation-end"クラスがあれば削除する
         * @param {Object} e イベントオブジェクト
         * @returns {Undefined} undefined
         */
        animationStartEv: function (e) {
            var $this = $(this);

            e.stopPropagation(e);

            if ($this.hasClass('kkc-anime_state_animation-end')) {
                $this.removeClass('kkc-anime_state_animation-end');
            }

            $this.addClass('kkc-anime_state_animation-start');

            return undefined;
        },
        /**
         * アニメーションが終わった際に"kkc-anime_state_animation-start"クラスを削除し、"kkc-anime_state_animation-end"クラスを追加
         * @param {Object} e イベントオブジェクト
         * @returns {Undefined} undefined
         */
        animationEndEv: function (e) {
            e.stopPropagation();

            $(this).removeClass('kkc-anime_state_animation-start').addClass('kkc-anime_state_animation-end');

            return undefined;
        },
        /**
         * windowオブジェクトにスクロールイベントを設定する
         * @param {Object} el 要素
         * @returns {Undefined} undefined
         */
        setScrollEv: function (el) {
            el.on('scroll', {self: this}, this.scrollEv);

            return undefined;
        },
        /**
         * windowオブジェクトのスクロールイベントを解除する
         * @param {Object} el 要素
         * @returns {Undefined} undefined
         */
        unsetScrollEv: function (el) {
            el.off('scroll', this.scrollEv);

            return undefined;
        },
        /**
         * スクロールイベント
         * この関数がイベントハンドラとして設定された場合はe.data.selfにkkc-animationオブジェクトの参照が入っている
         * @param {Object} e イベントオブジェクト
         * @returns {Undefined} undefined
         */
        scrollEv: function (e) {
            var self = e ? e.data.self : this;

            self.data.$scrollEl.each(function () {
                self.showScrollEl($(this), self);
            });

            return undefined;
        },
        /**
         * 要素が特定画面位置まで到達していたら kkc-anime_state_show クラスを付与する
         * @param {Object} $this kkc-anime_scrollクラスが付与されている要素
         * @param {Object} self kkcAnimationオブジェクト
         * @returns {Undefined} undefined
         */
        showScrollEl: function ($this, self) {
            var offsetTop = $this.offset().top;
            var height = $this.outerHeight();
            var halfHeight = offsetTop + (height / 1.5);
            var fadePointPCData = $this.data('fadePointPc');
            var fadePointSPData = $this.data('fadePointSp');
            var fadePointBreakPoint = $this.data('fadePointBreakPoint');
            var hasClass = $this.hasClass('kkc-anime_state_show');
            var fadePointOrigin = '';
            var fadePointNum = 0;
            var mql = false;
            var fadePoint = halfHeight;
            var winScrollTop = $win.scrollTop();
            var trigger = $this.data('trigger');
            var $triggerTarget = null;

            if (self.isAllScrollElDisplayed()) {
                self.unsetScrollEv($win);
                self.unsetResizeEv($win);

                return undefined;
            }

            // fadePointを設定している場合に限りtrue
            if (fadePointPCData && !hasClass) {
                fadePointPCData = fadePointPCData.split(':');
                fadePointOrigin = fadePointPCData[0];
                fadePointNum = parseInt(fadePointPCData[1], 10);

                if (fadePointSPData && fadePointBreakPoint) {
                    mql = window.matchMedia('(' + fadePointBreakPoint + ')');

                    if (mql.matches) {
                        fadePointSPData = fadePointSPData.split(':');
                        fadePointOrigin = fadePointSPData[0];
                        fadePointNum = parseInt(fadePointSPData[1], 10);
                    }
                }

                if (fadePointOrigin === 'top') {
                    fadePoint = offsetTop + fadePointNum;
                } else if (fadePointOrigin === 'bottom') {
                    fadePoint = offsetTop + height - fadePointNum;
                }
            }

            if (winScrollTop + this.data.winHeight >= fadePoint) {
                $this.addClass('kkc-anime_state_show');

                // triggerを設定している場合に限りtrue
                if (trigger) {
                    $triggerTarget = $('[data-trigger-name="' + trigger + '"]');
                    $triggerTarget.addClass('kkc-anime_state_ignition');
                }
            }

            return undefined;
        },
        /**
         * スクロールイベントが指定された要素が全て表示されたかどうかを判定
         * @returns {Boolean} boolean
         */
        isAllScrollElDisplayed: function () {
            var scrollElLen = this.data.$scrollEl.length;
            var stateShowOfScrollEl = $('[class*=kkc-anime_scroll].kkc-anime_state_show');
            var stateShowOfScrollElLen = stateShowOfScrollEl.length;

            if (scrollElLen === stateShowOfScrollElLen) {
                return true;
            }

            return false;
        },
        /**
         * windowオブジェクトにリサイズイベントを設定する
         * @param {Object} el 要素
         * @returns {Undefined} undefined
         */
        setResizeEv: function (el) {
            el.on('resize', {self: this}, this.resizeEv);

            return undefined;
        },
        /**
         * windowオブジェクトのリサイズイベントを解除する
         * @param {Object} el 要素
         * @returns {Undefined} undefined
         */
        unsetResizeEv: function (el) {
            el.off('resize', this.resizeEv);

            return undefined;
        },
        /**
         * リサイズイベント
         * @returns {Undefined} undefined
         */
        resizeEv: function (e) {
            var self = e.data.self;

            self.data.winHeight = $win.outerHeight();

            return undefined;
        }
    };

    kkcAnimation.init();
    window.kkcAnimation = kkcAnimation;
}());
