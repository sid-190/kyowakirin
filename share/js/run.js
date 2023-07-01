(function () {
    'use strict';

    var $win = $(window);
    var $doc = $(document);
    var $body = $('body');
    var $winWidth = $win.outerWidth();
    var focusable = 'a, button, input, textarea, select, [tabindex]';
    var duration = 800;
    var funcCheckSpView;
    var funcAdjustSlickTabindex;
    var funcDisableScrollSp;
    var FOCUS_ELEMENTS = 'a[href], area[href], [tabindex], button, input, select, textarea, iframe, object, audio, video, output, embed';

    /* ==================
    画面幅をチェックし、SP幅かどうか結果を返す
    ================== */
    funcCheckSpView = function (breakPointNum) {
        var flg = false;
        var breakPoint = 768; //  デフォルトブレイクポイント数値
        var windowWidth = $win.outerWidth();

        //  引数としてブレイクポイントが設定されていた時上書き
        if (typeof breakPointNum !== 'string' && typeof breakPointNum === 'number') {
            breakPoint = breakPointNum;
        }

        if (breakPoint <= windowWidth) {
            //  PC幅
            flg = false;
        } else {
            //  SP幅
            flg = true;
        }

        return flg;
    };

    /* ==================
    slickのtabindexを調整する
    ================== */
    funcAdjustSlickTabindex = function ($slickTarget) {
        var $slickWrapper = $slickTarget;
        var $slickSlideAll = $slickWrapper.find('.slick-slide');
        var $visibleSlideElement;

        if ($slickWrapper.length === 0) {
            return false;
        }

        $visibleSlideElement = $slickWrapper.find('.slick-active');
        $slickSlideAll.attr('tabindex', '-1');
        $visibleSlideElement.attr('tabindex', '0');

        return true;
    };

    /* ====================
    アンカーリンク
    ==================== */
    (function () {
        var $scrollLink = $('a[href^="#anc"], a[href*="/index.html#anc"]');
        var $hashTarget;
        var hashId = location.hash;
        var funcMoveTargetAnchor;

        funcMoveTargetAnchor = function ($targetAnchor) {
            var position = 0;
            var headerHeight = 0;
            var speed = 400;
            var scrollElement = 'scrollingElement' in document ? document.scrollingElement : document.documentElement;

            if (funcCheckSpView()) {
                // SP
                headerHeight = 60;
            } else {
                // PC
                headerHeight = $body.find('.header-inner').outerHeight();
            }

            position = Math.floor($targetAnchor.offset().top) - headerHeight;
            position -= 30;

            // スクロール対象アンカーへ移動
            $(scrollElement).animate({
                scrollTop: position
            }, speed, 'swing', function () {
                if ($targetAnchor.is(focusable)) {
                    $targetAnchor.focus();

                    return;
                }

                $targetAnchor.attr('tabindex', '0').focus();
                $targetAnchor.on('blur', function () {
                    $targetAnchor.removeAttr('tabindex');
                });
            });
        };

        // ハッシュ遷移があった場合
        if (hashId !== '') {
            $hashTarget = $body.find(hashId);

            if ($hashTarget.length === 0) {
                return;
            }
            if (/^#tab-\d*/.test(hashId)) {
                // タブリンクモジュールの場合
                $hashTarget = $body.find('a[href="' + hashId + '"]');
            }
            if ($hashTarget.length === 0) {
                return;
            }

            $win.on('load.loadScrollAnchor', function () {
                funcMoveTargetAnchor($hashTarget);
            });
        }

        // アンカーリンクイベントの設定
        $scrollLink.on('click.moveAnchor', function (e) {
            var $self = $(this);
            var href = $self.attr('href');
            var $scrollTarget;
            var hrefAfter = '';
            var currentPath = location.pathname;

            if (/^(http|https)/.test(href)) {
                return;
            }

            if (/^\/.*#.*$/.test(href)) {
                if (href.split('#')[0] !== currentPath) {
                    // 別ページへのアンカー遷移（ルート相対）
                    return;
                }
            }

            e.preventDefault();

            // アンカーリンクのパターンが別の場合整形
            if (/^(?!#.*)/.test(href)) {
                hrefAfter = href.split('#').pop();
                href = '#' + hrefAfter;
            }

            $scrollTarget = $((href === '#' || href === '') ? 'html' : href);
            if ($scrollTarget.length === 0) {
                return;
            }

            funcMoveTargetAnchor($scrollTarget);
        });
    }());

    /* ====================
    リサイズ、ページロードで発火させる機能
    ==================== */
    (function () {
        var timeout;
        var funcAddCurrentLinkStyle;
        var funcInitHeaderGlobal;
        var funcSlickSliderOnSpInit;
        var funcLocalNavToggle;
        var funcHideWhatDoWeDoContent;
        var funcHideWhatDoWeDoContentData = {
            isInit: true,
            deviceState: null,
            $targetHideElements: null,
            $hideElements: null,
            $hideElementsClone: null
        };

        /* ====================
        グローバルナビ（ヘッダー部分）
        ==================== */
        funcInitHeaderGlobal = function () {
            var funcHeader;
            var headerBreakPoint = 1059;

            //  ===== 関数を定義 =====

            // 表示ディレクトリに応じてカレントスタイルを付与する
            funcAddCurrentLinkStyle = function ($targetLink) {
                var currentPath = location.pathname;

                $targetLink.each(function () {
                    var $link = $(this);
                    var linkHref = $link.attr('href');

                    if (linkHref === currentPath) {
                        $link.addClass('current');
                    }
                });
            };

            //  共通ヘッダー部分の処理
            funcHeader = function () {
                var $header = $('body').find('.header');
                var $headerlogo = $header.find('.logo a');
                var $targetHideInputMenu = $header.find('.header-menu > li:not(:last-child)');
                //  検索エリア
                var $inputSearchAreaPc = $header.find('.header-menu').find('.header-input-search');
                var $inputSearchAreaSp = $header.find('.header-menu-sp').find('.header-input-search');
                //  ボタン
                var $btnSearch = $header.find('.header-btn-search');
                var $btnSpMenu = $header.find('.btn-sp-menu');
                var $btnGlobalMenu = $header.find('.btn-menu-global');
                var $btnGlobalMenuWorldwide = $btnGlobalMenu.attr('id');
                var $btnCloseSearchAreaPc = $inputSearchAreaPc.nextAll('.header-btn-delete');
                var $btnCloseSearchSubmitPc = $inputSearchAreaPc.nextAll('.header-btn-search-submit');
                var $btnCloseSearchAreaSp = $inputSearchAreaSp.nextAll('.header-btn-delete');
                var $btnCloseSearchSubmitSp = $inputSearchAreaSp.nextAll('.header-btn-search-submit');
                //  メニュー
                var $boxGlobalMenuArea = $header.find('.menu-global-wrapper');
                var $btnTargetSpToggle = $boxGlobalMenuArea.find('.menu-global-hdg-lv3');
                var $pcMenuList = $body.find('.header-menu > li');
                var $pcMenuArea = $pcMenuList.find('.header-menu-inner');
                var $SpMenuList = $header.find('.header-menu-sp');
                var $globalMenuList = $boxGlobalMenuArea.find('ul');
                var $toggleSpMenu = $SpMenuList.find('.btn-header-menu-sp-toggle');

                //
                var $hash = location.hash.slice(1);

                //  初期処理
                duration = 300;
                $body.removeClass('js-sp-overlay');
                $btnSearch.removeAttr('style');
                $SpMenuList.hide();
                $globalMenuList.show();
                $btnTargetSpToggle.off('click.spGlobalToggle').removeAttr('tabindex roll');
                $btnSpMenu.removeClass('open').find('img').attr({
                    src: '/share/images/icon_menu_sp_01.png',
                    alt: 'open menu'
                });

                /* ==================
                検索エリアの切り替え
                ================== */
                $btnSearch.off('click.switchInputSearch').on('click.switchInputSearch', function () {
                    if (funcCheckSpView(headerBreakPoint)) {
                        //  SP幅時の検索エリア切替
                        if ($inputSearchAreaSp.is(':hidden')) {
                            $btnSearch.css('opacity', '1');
                            $btnSearch.hide();
                            $btnCloseSearchSubmitSp.fadeIn(300);
                            $inputSearchAreaSp.fadeIn(300, function () {
                                $(this).focus();
                            });

                            //  入力欄の値を削除する
                            $btnCloseSearchAreaSp.fadeIn(300).on('click.spCloseSearchArea', function () {
                                $(this).fadeOut(300);
                                $btnCloseSearchSubmitSp.fadeOut(300);
                                $inputSearchAreaSp.fadeOut(300, function () {
                                    $btnSearch.css('opacity', '.4');
                                    $btnSearch.fadeIn(300);
                                    $targetHideInputMenu.fadeIn(300);
                                    $inputSearchAreaSp.fadeOut(300);
                                    $btnCloseSearchAreaSp.fadeOut(300).off('click.spCloseSearchArea');
                                });
                            });
                        }

                        return;
                    }

                    //  PC幅時の検索エリア切替
                    if ($targetHideInputMenu.is(':visible')) {
                        $btnSearch.fadeOut(duration);
                        $targetHideInputMenu.fadeOut(duration, function () {
                            $inputSearchAreaPc.fadeIn(duration).focus();
                            // 検索ボタンを表示
                            $btnCloseSearchSubmitPc.fadeIn(duration);
                            $btnCloseSearchAreaPc.fadeIn(duration).on('click.pcCloseSearchArea', function () {
                                $(this).fadeOut(duration);
                                $btnCloseSearchSubmitPc.fadeOut(duration);
                                $inputSearchAreaPc.fadeOut(duration, function () {
                                    $btnSearch.fadeIn(duration);
                                    $targetHideInputMenu.fadeIn(duration);
                                    $inputSearchAreaPc.fadeOut(duration);
                                    $btnCloseSearchAreaPc.fadeOut(duration).off('click.pcCloseSearchArea');
                                });
                            });
                        });
                    }
                });

                if (funcCheckSpView(headerBreakPoint)) {
                    /* ==================
                    SP表示時 トグルメニュー（グローバル）
                    ================== */
                    $globalMenuList.hide();
                    $btnTargetSpToggle.each(function () {
                        var $accordion = $(this);

                        $accordion.attr({
                            tabindex: '0'
                        });
                        //  メニュー内部トグル
                        $accordion.off('click.spGlobalToggle').on('click.spGlobalToggle', function () {
                            var $self = $(this);
                            var $targetList = $self.next('ul');
                            var $icon = $self.find('.icon');

                            $self.toggleClass('open');

                            if ($self.hasClass('open')) {
                                $globalMenuList.not($targetList).slideUp(duration, function () {
                                    $(this).prev().removeClass('open');
                                });
                                $targetList.slideDown(duration);
                                $icon.text('close');
                            } else {
                                $targetList.slideUp(duration);
                                $icon.text('open');
                            }
                        });
                        $accordion.off('focus.spGlobalToggleFocusIn').on('focus.spGlobalToggleFocusIn', function () {
                            $(this).off('keydown.spGlobalKeyPress').on('keydown.spGlobalKeyPress', function (e) {
                                if (e.keyCode === 13) {
                                    //  Enter Key Event
                                    $(this).trigger('click.spGlobalToggle');
                                }
                            });
                        });
                    });

                    /* ==================
                    SP表示時 トグルメニュー（右）
                    ================== */
                    $btnSpMenu.off('click.SpMenuToggle').on('click.SpMenuToggle', function () {
                        var $self = $(this);
                        var $icon = $self.find('img');

                        $self.toggleClass('open');
                        if ($self.hasClass('open')) {
                            $body.addClass('js-sp-overlay');
                            $icon.attr({
                                alt: 'close menu',
                                src: '/share/images/icon_menu_sp_02.png'
                            });

                            if ($boxGlobalMenuArea.is(':visible')) {
                                $SpMenuList.css('z-index', '100');
                            }

                            $SpMenuList.slideDown(duration);
                        } else {
                            if (!$boxGlobalMenuArea.is(':visible')) {
                                $body.removeClass('js-sp-overlay');
                            }

                            $icon.attr({
                                alt: 'open menu',
                                src: '/share/images/icon_menu_sp_01.png'
                            });

                            $SpMenuList.slideUp(duration, function () {
                                $SpMenuList.css('z-index', '0');
                            });
                        }
                    });

                    /* ==================
                    SP表示時 トグルメニュー（右）内のトグルメニュー
                    ================== */
                    $toggleSpMenu.each(function () {
                        var $selfBtn = $(this);
                        var durationToggle = 300;

                        $selfBtn.off('click.spMenuToggle').on('click.spMenuToggle', function (e) {
                            var $target = $selfBtn.next('.header-menu-sp-toggle');
                            var $targetAreaLinks = $target.find('a');
                            var $icon = $selfBtn.find('span');

                            e.preventDefault();
                            $selfBtn.addClass('open');
                            $toggleSpMenu.not($selfBtn).removeClass('open');

                            if ($selfBtn.hasClass('open')) {
                                $toggleSpMenu.find('span').text('open');
                                $icon.text('close');
                            } else {
                                $icon.text('open');
                            }

                            if ($target.is(':visible')) {
                                $selfBtn.removeClass('open');
                                $target.stop(true, true).slideUp(durationToggle);
                            } else {
                                $SpMenuList.find('.header-menu-sp-toggle').not($selfBtn).stop(true, true).slideUp(durationToggle);
                                $target.stop(true, true).slideToggle(durationToggle);
                            }

                            $targetAreaLinks.each(function () {
                                $(this).on('click', function () {
                                    // リンクをクリックでメニュー自体を閉じる
                                    $btnSpMenu.trigger('click.SpMenuToggle');
                                });
                            });
                        });
                    });
                }

                /* ======================================= */

                //  PC表示
                /* ==================
                PC表示時 トグルメニュー（グローバル）
                ================== */

                if ($hash.length) {
                    if ($hash == $btnGlobalMenuWorldwide){
                        $btnGlobalMenu.toggleClass('open');
                        if ($btnGlobalMenu.hasClass('open')) {
                            if (funcCheckSpView(headerBreakPoint)) {
                                if ($SpMenuList.is(':visible')) {
                                    $boxGlobalMenuArea.css('z-index', '100');
                                }
                            }

                            $btnGlobalMenu.text('close menu');
                            $boxGlobalMenuArea.slideDown(duration, function () {
                                $(this).find(focusable).first().focus();
                            });
                        } else {
                            if (!$SpMenuList.is(':visible')) {
                                $body.removeClass('js-sp-overlay');
                            }

                            $btnGlobalMenu.text('open menu');
                            $boxGlobalMenuArea.slideUp(duration, function () {
                                if (funcCheckSpView(headerBreakPoint)) {
                                    $boxGlobalMenuArea.css('z-index', '0');
                                }
                            });
                        }
                    }
                }

                $btnGlobalMenu.off('click.openGlobalMenu').on('click.openGlobalMenu', function () {
                    var $self = $(this);

                    if (funcCheckSpView(headerBreakPoint)) {
                        $body.addClass('js-sp-overlay');
                    }

                    $self.toggleClass('open');
                    if ($self.hasClass('open')) {
                        if (funcCheckSpView(headerBreakPoint)) {
                            if ($SpMenuList.is(':visible')) {
                                $boxGlobalMenuArea.css('z-index', '100');
                            }
                        }

                        $self.text('close menu');
                        $boxGlobalMenuArea.slideDown(duration, function () {
                            $(this).find(focusable).first().focus();
                        });
                    } else {
                        if (!$SpMenuList.is(':visible')) {
                            $body.removeClass('js-sp-overlay');
                        }

                        $self.text('open menu');
                        $boxGlobalMenuArea.slideUp(duration, function () {
                            if (funcCheckSpView(headerBreakPoint)) {
                                $boxGlobalMenuArea.css('z-index', '0');
                            }
                        });
                    }
                });

                /* ==================
                通常グロナビメニュー部分トグル切替
                ================== */
                $pcMenuList.each(function () {
                    var $selfList = $(this);
                    var $targetMenu = $selfList.find('.header-menu-inner');
                    var $menuLink = $selfList.find('a');

                    // カレントスタイル付与
                    funcAddCurrentLinkStyle($menuLink);

                    if ($targetMenu.length === 0) {
                        return;
                    }

                    $selfList.off('mouseenter.SlideDownOnHover focusin.slideDownOnFocus').on('mouseenter.SlideDownOnHover focusin.slideDownOnFocus', function () {
                        if ($targetMenu.is(':visible')) {
                            return;
                        }

                        $pcMenuArea.not($targetMenu).slideUp(duration);
                        $targetMenu.stop(true, true).slideDown(duration);
                    });

                    $selfList.off('mouseleave.slideUpOnHoverOut').on('mouseleave.slideUpOnHoverOut', function () {
                        $pcMenuArea.stop(true, true).slideUp(duration);
                    });
                });

                $headerlogo.on('focusin', function () {
                    if ($pcMenuArea.is(':visible')) {
                        $pcMenuArea.stop(true, true).slideUp(duration);
                    }
                });
            };

            //  ==== 機能を実行 ====
            funcHeader();
        };

        /* ====================
        slickスライダー(SP幅のみ発火させる)
        ==================== */
        funcSlickSliderOnSpInit = function () {
            var $moduleLayoutBoxSlider = $body.find('.box-layout[data-sp-slider="1"]');
            var targetBreakPoint = 786;

            if ($moduleLayoutBoxSlider.length === 0) {
                return;
            }

            if (!funcCheckSpView(targetBreakPoint)) {
                if ($moduleLayoutBoxSlider.hasClass('slick-initialized')) {
                    $moduleLayoutBoxSlider.slick('unslick').find('.col').removeAttr('tabindex style id aria-describedby role');
                }
            } else {
                $moduleLayoutBoxSlider.slick({
                    arrows: false,
                    variableWidth: true,
                    dots: true,
                    slidesToShow: 1,
                    slidesToScroll: 1
                });
            }
        };

        /* ====================
        Product配下ページのローカルナビエリア機能
        ==================== */
        funcLocalNavToggle = function () {
            var $root = $body.find('.link-nav-local-wrapper');
            var $btnToggleNavLocal;
            var $btnToggleNavLocalIcon;
            var $linkNavLocal;
            var $targetToggleArea;
            var currentPath = location.pathname;

            if ($root.length === 0) {
                return;
            }

            $btnToggleNavLocal = $root.find('.btn-nav-local-toggle');
            $btnToggleNavLocalIcon = $btnToggleNavLocal.find('span');
            $linkNavLocal = $root.find('.list-nav-local').find('a');
            $targetToggleArea = $root.find('.nav-local-area');

            // リンクをチェックしてカレントスタイルを付与
            $linkNavLocal.each(function () {
                var $selfLink = $(this);
                var selfHref = $selfLink.attr('href');

                if (currentPath === selfHref) {
                    $selfLink.addClass('current');
                }
            });

            // トグルによる切替
            if (!funcCheckSpView()) {
                $targetToggleArea.show();
            }

            $btnToggleNavLocal.off('click.toggleNavLocal').on('click.toggleNavLocal', function () {
                var $selfBtn = $(this);

                if ($selfBtn.hasClass('open')) {
                    // 閉じる
                    $selfBtn.removeClass('open');
                    $targetToggleArea.stop(true, true).slideUp(duration, function () {
                        $btnToggleNavLocalIcon.text('open');
                    });
                } else {
                    // 開く
                    $selfBtn.addClass('open');
                    $targetToggleArea.stop(true, true).slideDown(duration, function () {
                        $btnToggleNavLocalIcon.text('close');
                    });
                }
            });
        };

        /* ====================
        what_we_doページ コンテンツ非表示制御
        ==================== */
        funcHideWhatDoWeDoContent = function () {
            var data = funcHideWhatDoWeDoContentData;
            var $root = $body.find('.list-global-base');
            var $targetHideElements = $root.find('li');
            var $btnMore = $root.next('.btn-more');
            var $hideElements = null;
            var $hideElementsClone = null;
            var deviceType = funcCheckSpView() ? 'sp' : 'pc';
            var removeAnimationClassName = 'kkc-anime_state_show kkc-anime_state_animation-end';
            var setAnimation = function () {
                if (window.hasOwnProperty('kkcAnimation')) {
                    window.kkcAnimation.unsetEvOfAnimationEl($win)
                    window.kkcAnimation.unsetScrollEv($win);
                    window.kkcAnimation.unsetResizeEv($win);
                    window.kkcAnimation.fetchAnimationEl();
                    window.kkcAnimation.init();
                }
            };

            if ($targetHideElements.length === 0) {
                return;
            }

            // 初期化処理
            if (data.isInit) {
                $btnMore.hide();
            }

            // 非表示コンテンツにクラスを付与
            $targetHideElements.each(function (index) {
                if (index >= 3) {
                    $(this).addClass('js-hide');
                }
            });

            $hideElements = $root.find('.js-hide');
            $hideElementsClone = data.$hideElementsClone || $hideElements.clone(true);

            if (!data.$hideElementsClone) {
                data.$hideElementsClone = $hideElementsClone;
            }

            // spサイズで初期化した場合の処理
            if (data.isInit && deviceType === 'sp') {
                $btnMore.show();
                $hideElements.remove();
                data.deviceState = 'sp';
            }

            // pcサイズで初期化した場合の処理
            if (data.isInit && deviceType === 'pc') {
                data.deviceState = 'pc';
            }

            // pcサイズからspサイズに変更した場合の処理
            if (data.deviceState === 'pc' && deviceType === 'sp') {
                $btnMore.show();
                $hideElements.remove();
                $targetHideElements.removeClass(removeAnimationClassName);
                setAnimation();

                data.deviceState = 'sp';
            }

            // spサイズからpcサイズに変更した場合の処理
            if (data.deviceState === 'sp' && deviceType === 'pc') {
                $btnMore.hide();
                $root.append($hideElementsClone);
                $targetHideElements.removeClass(removeAnimationClassName);
                setAnimation();

                data.deviceState = 'pc';
            }

            // 初期化処理
            if (data.isInit) {
                data.isInit = false;
            }

            $btnMore.off('click.showHideContent').on('click.showHideContent', function () {
                $(this).hide();
                $root.append($hideElementsClone);
                setAnimation();
            });
        };

        //  イベントを実行する
        funcInitHeaderGlobal(); // グローバルヘッダー処理
        funcSlickSliderOnSpInit(); // SP幅のカルーセル化処理
        funcLocalNavToggle();
        funcHideWhatDoWeDoContent();


        // グローバルナビの変更点をリサイズではなくブレイクポイントで実行
        var mediaQueryList = window.matchMedia('(max-width:1060px)');
        function mediaQueryListener () {
            if (mediaQueryList.matches) {
                funcInitHeaderGlobal();
            } else {
                funcInitHeaderGlobal();
            }
        }
        mediaQueryList.addEventListener('change', mediaQueryListener);

        $win.on('resize', function () {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                var $winWidthAfter = $win.outerWidth();
                var isIOS = /iP(hone|(o|a)d)/.test(navigator.userAgent)

                //  iOS対策
                if (isIOS && $winWidth === $winWidthAfter) {
                    return false;
                }

                funcSlickSliderOnSpInit(); // SP幅のカルーセル化処理
                funcLocalNavToggle();
                funcHideWhatDoWeDoContent();
            }, 200);
        });
    }());

    /* ====================
    サイトトップページアニメーション
    ==================== */
    (function () {
        var timeout;
        /**
         * Core Value セクションの豆ホバー時のアニメーション
         * @returns {Undefined}
         */
        var funcCoreValueToggle = function () {
            var $root = $body.find('.box-corevalue-wrapper');
            var $parts;
            var $afterImgs;
            var flgArr = [];

            if (!$root) {
                return false;
            }

            $parts = $root.find('.parts-feature').not(':first-child');
            $afterImgs = $parts.find('.parts-feature-after');

            $parts.each(function () {
                var $this = $(this);
                var $beforeImg = $this.find('.parts-feature-before');
                var $afterImg = $this.find('.parts-feature-after');
                var $otherBeforeImg = $parts.not($this).find('.parts-feature-before');
                var idx = $this.index();

                flgArr[idx] = false;

                if (funcCheckSpView()) {
                    $this.off('mouseenter focusin').off('mouseleave focusout');
                    $beforeImg.show();
                    $otherBeforeImg.removeClass('minimum');
                    $afterImgs.off('transitionend').removeClass('minimum').hide();
                } else {
                    $afterImgs.on('transitionend', function () {
                        if (flgArr[idx]) {
                            $afterImg.hide();
                            $beforeImg.show();
                        }
                    });
                    $this.on('mouseenter focusin', function () {
                        $otherBeforeImg.addClass('minimum');
                        $beforeImg.hide();
                        $afterImg.addClass('minimum').show(0, function () {
                            $(this).removeClass('minimum');

                            flgArr[idx] = false;
                        });
                    });
                    $this.on('mouseleave focusout', function () {
                        $otherBeforeImg.removeClass('minimum');
                        $afterImg.addClass('minimum');

                        flgArr[idx] = true;
                    });
                }
            });
        };

        funcCoreValueToggle();

        $win.on('resize', function () {
            clearTimeout(timeout);
            timeout = setTimeout(funcCoreValueToggle, 100);
        });
    }());

    /* ====================
    モーダルコンテンツ(TOPページ)
    ==================== */
    (function () {
        var $html = $('html');
        var $focusableInBody = $body.find(focusable);
        var $modalTrigger = $body.find('.btn-modalopen');
        var $btnClose = $body.find('.btn-close-modal');
        var $clickedBtn = null;

        if (!$modalTrigger.length) {
            return false;
        }

        /**
         * モーダル内のコンテンツにtabindexを付与
         */
        $modalTrigger.each(function () {
            var $this = $(this);
            var $targetModal = $($this.attr('href'));

            $targetModal.find(focusable).attr('tabindex', '-1');
        });
        /**
         * モーダルを開く
         */
        $modalTrigger.on('click', function (e) {
            var $this = $(this);
            var $targetModal = $($this.attr('href'));
            var current_scrollY = $win.scrollTop();

            e.preventDefault();

            $html.addClass('js-noscroll');
            $body.css('top', -1 * current_scrollY);
            $focusableInBody.attr('tabindex', '-1');
            $targetModal.addClass('modal-active').delay(500).queue(function (next) {
                var $this = $(this);

                $this.css('backgroundColor', 'rgba(255, 255, 255, .4)');
                $this.find(focusable).attr('tabindex', '0').first().focus();
                next();
            });

            $clickedBtn = $this;
        });
        /**
         * モーダルを閉じる
         */
        $btnClose.on('click', function () {
            var $this = $(this);
            var $targetModal = $this.closest('.box-modal-content');

            $html.removeClass('js-noscroll');
            $body.removeAttr('style');
            $focusableInBody.attr('tabindex', '0');
            $targetModal.removeAttr('style').removeClass('modal-active');
            $targetModal.find(focusable).attr('tabindex', '-1');
            $clickedBtn.focus();
        });

        return false;
    }());

    /* ====================
    モーダル表示(汎用)
    ==================== */
    (function () {
        // 要素の存在チェック
        var checkLength = function ($element) {
            return $element.length <= 0;
        };

        $('.js-modal').each(function () {
            var $this = $(this);
            var $hook = $this.find('.js-modal-hook');
            var $modalContent = $($hook.attr('href'));
            var $modalInner = $modalContent.find('.js-modal-inner');
            var modalOverlay = '<div class="box-modal-overlay-02 is-hidden"></div>';
            var $modalOverlay = $('.box-modal-overlay-02');
            var closeButton = $('<button class="modal-button" type="button"><span>Close Modal Window</span></button>');
            var deferred = new $.Deferred();
            var $focusElement = $(FOCUS_ELEMENTS);
            var $closeButton = null;

            if (checkLength($this)) {
                return;
            }

            function addElement() {
                closeButton.appendTo($modalInner);

                if (!$modalOverlay.length) {
                    $modalOverlay = $(modalOverlay);
                    $modalOverlay.appendTo($body);
                    $modalOverlay = $('.box-modal-overlay-02');
                }
                // 完了後、動的に生成した要素をjQueryオブジェクト化する
                deferred.resolve();
            }

            function closeModal() {
                var bodyTop = $body.css('marginTop').replace(/-/, '').replace(/px/, '');

                $modalContent.removeClass('is-animation');
                $modalOverlay.removeClass('is-visible');

                setTimeout(function () {
                    if (!$modalOverlay.hasClass('is-visible')) {
                        $modalContent.removeClass('is-visible');
                        $modalOverlay.addClass('is-hidden');
                        $body.removeClass('is-fixed').css('marginTop', '');
                        $win.scrollTop(bodyTop);
                        $focusElement.removeAttr('tabindex');

                        // モーダルを閉じた際に特定端末でページトップへ移動してしまう対策
                        setTimeout(function () {
                            if ($win.scrollTop() === 0) {
                                $win.scrollTop(bodyTop);
                            }
                        }, 1);
                    } else {
                        $modalOverlay.addClass('is-visible');
                    }
                }, 500);
            }

            function clickHandler() {
                $hook.on('click', function (e) {
                    var $target = $(e.currentTarget);
                    var $targetContent = $($target.attr('href'));
                    var $targetFocusable = $targetContent.find(FOCUS_ELEMENTS);
                    var scrollY = $win.scrollTop();

                    e.preventDefault();

                    $body.css('marginTop', '-' + scrollY + 'px').addClass('is-fixed');
                    $modalOverlay.removeClass('is-hidden').addClass('is-visible');
                    $targetContent.addClass('is-visible');
                    $focusElement.prop('tabindex', -1);

                    deferred.resolve().then(function () {
                        $targetContent.addClass('is-animation');
                        $targetFocusable.prop('tabindex', 0);
                    });
                });

                $modalContent.on('click', function (e) {
                    if ($(e.target).hasClass('js-modal-content')) {
                        closeModal();
                    }
                });
            }

            // 機能実行
            clickHandler();
            addElement();

            // 動的に付与される要素の為、非同期で機能実行
            deferred.then(function () {
                $closeButton = $modalContent.find('.modal-button');
                $closeButton.on('click', closeModal);
            });
        });
    }());

    /* ====================
    カルーセル
    ==================== */
    (function () {
        var $boxCarousel1 = $body.find('.box-carousel-01');
        var $btnPrev;
        var $btnNext;

        if ($boxCarousel1.length === 0) {
            return;
        }

        //  Slickを実行
        $boxCarousel1.slick({
            accessibility: false,
            arrows: true,
            dots: false,
            slidesToShow: 4,
            slidesToScroll: 1,
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        centerPadding: '0px',
                        dots: true,
                        centerMode: true,
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        });

        $boxCarousel1.on('afterChange', function (e, slick, currentSlide) {
            funcAdjustSlickTabindex($(this));
        });
    }());

    /* ====================
    動画モーダル表示
    ==================== */
    (function () {
        var $root = $body.find('.box-movie-modal-wrapper');

        if ($root.length === 0) {
            return;
        }

        $root.each(function (index) {
            var $selfWrapper = $(this);
            var $targetTrigger = $selfWrapper.find('.box-movie-thumb');
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

                    $body.find('.box-movie-thumb').attr('tabindex', '0');
                    $body.find('.box-movie-thumb[data-modal-movie-id="' + $movieFrame.attr('id') + '"]').focus();

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

    /* ====================
    タブボックスモジュール 1
    ==================== */
    (function () {
        var $root = $body.find('.box-tab-01');
        var anchorHash = location.hash;

        if ($root.length === 0) {
            return;
        }

        $root.each(function () {
            var $selfWrapper = $(this);
            var $listTabLink = $selfWrapper.find('.list-tab');
            var $targetContent = $selfWrapper.find('.box-tab-content');
            var $btnTabLink = $listTabLink.find('a[href^="#"]');
            var $btnTabLinkFirstCurrent = $listTabLink.find('a[href^="#"].current').first();
            var $anchorTarget;
            var switchTabContent;

            switchTabContent = function ($targetContents, targetId) {
                var $target = $targetContents.filter(targetId);

                $targetContent.not(targetId).hide();
                $target.fadeIn(duration);
            };

            //  初期処理
            if (anchorHash.length === 0 && $btnTabLinkFirstCurrent.length === 0) {
                $btnTabLink.first().addClass('current');
                $targetContent.first().show();
            } else if (anchorHash.length !== 0) {
                //  ハッシュ遷移
                $anchorTarget = $listTabLink.find('a[href="' + anchorHash + '"]');
                if ($anchorTarget.length !== 0) {
                    $btnTabLink.removeClass('current');
                    $anchorTarget.addClass('current');

                    //  コンテンツ切替
                    switchTabContent($targetContent, anchorHash);
                } else {
                    $btnTabLink.removeClass('current').first().addClass('current');
                    $targetContent.first().show();
                }
            } else if ($btnTabLinkFirstCurrent.length !== 0) {
                //  初期表示指定のタブリンクが存在(ハッシュ指定の遷移があった場合はそちらの表示を優先する)
                $btnTabLinkFirstCurrent.addClass('current');
                switchTabContent($targetContent, $btnTabLinkFirstCurrent.attr('href'));
            }

            //  イベント設定
            $btnTabLink.each(function () {
                $(this).off('click.moveAnchor').on('click.changeTabContent', function (e) {
                    var $selfBtn = $(this);
                    var targetId = $selfBtn.attr('href');
                    var $targetShowContent;

                    e.preventDefault();
                    $targetShowContent = $targetContent.filter(targetId);

                    if (!$targetShowContent.is(':visible')) {
                        $btnTabLink.removeClass('current');
                        $selfBtn.addClass('current');
                        switchTabContent($targetContent, targetId);
                    }
                });
            });
        });
    }());

    /* ====================
    タブボックスモジュール 2(CSの上下タブ機能を移植)
    ==================== */
    (function () {
        $('.js-tab-toggle').each(function () {
            var $this = $(this);
            var $hookList = $this.find('.js-hook-list');
            var $list = $hookList.children('li');
            var $hook = $list.children('a');
            var $content = $this.find('.js-tab-content');
            var $contentInner = $content.find('.js-content-inner');
            var isAnimation = false;
            var duration = 500;
            var buffer = 10;
            var timeout;

            if ($this.length === 0) {
                return;
            }

            function initWideTab() {
                $hook.removeClass('is-open');
                $content.addClass('is-hidden');
                $content.eq(0).removeClass('is-hidden').addClass('is-visible');
                $hook.eq(0).addClass('is-open');
                $this.addClass('is-loaded');

                $list.find('.is-open > .mark').text('表示中');
            }

            function initNarrowTab() {
                $hook.removeClass('is-open');
                $content.addClass('is-hidden');
                $this.addClass('is-loaded');

                $list.find('.is-open > .mark').text('閉じる');
            }

            function addMarkTxt() {
                var i = 0;
                var maxLength = $hook.length;
                var span = null;

                for (; i < maxLength; i++) {
                    span = $('<span class="mark">開く</span>');
                    span.appendTo($hook.eq(i));
                }
            }

            function moveContent() {
                var i = 0;
                var $cloneTabList;

                if (funcCheckSpView()) {
                    for (; i < $content.length; i++) {
                        $content.eq(i).appendTo($list.eq(i));
                    }
                    if ($this.hasClass('js-tabBottom')) {
                        $this.find('.copy').remove();
                    }
                } else {
                    for (; i < $content.length; i++) {
                        $content.eq(i).appendTo($this);
                    }
                    if ($this.hasClass('js-tabBottom')) {
                        $this.find('.copy').remove();
                        $cloneTabList = $this.find('.js-hook-list').clone(true).addClass('copy');

                        $this.append($cloneTabList);
                    }
                }

                if ($('.js-hook-list').hasClass('copy')) {
                    $hookList = $this.find('.js-hook-list');
                    $list = $hookList.children('li');
                    $hook = $list.children('a');
                }
            }

            function clickHandler() {
                $hook.on('click', function (e) {
                    var $target = $(e.currentTarget);
                    var $targetContent = $($target.attr('href'));
                    var $targetInner = $targetContent.find('.tab-content-inner');
                    var $targetParentToggle = $target.closest('.js-tab-toggle');
                    var $anotherTab = $targetParentToggle.find('.js-hook-list.copy');
                    var $listIndex = $target.parent().index();
                    var switchContent = function () {
                        if (!$this.hasClass('is-narrow')) {
                            $hook.removeClass('is-open');

                            $content.removeClass('is-visible').addClass('is-hidden');
                        }

                        $target.addClass('is-open');

                        if ($this.hasClass('js-tabBottom')) {
                            if ($target.closest('.js-hook-list').hasClass('copy')) {
                                $anotherTab = $targetParentToggle.find('.js-hook-list').not('.copy');
                            }

                            $anotherTab.find('li').eq($listIndex).find('a').addClass('is-open');
                        }

                        $content.removeClass('is-visible');
                        $targetContent.removeClass('is-hidden').addClass('is-visible');
                        $contentInner.addClass('is-visible is-animation');
                        setTimeout(function () {
                            $contentInner.removeClass('is-animation');
                        }, buffer);
                    };

                    e.preventDefault();

                    if (isAnimation) {
                        return;
                    }

                    isAnimation = true;

                    if ($this.hasClass('is-wide') && $target.hasClass('is-open')) {
                        isAnimation = false;

                        return;
                    } else if ($this.hasClass('is-wide')) {
                        $hook.find('.mark').text('開く');
                        $target.find('.mark').text('表示中');
                        switchContent();
                    }

                    if ($this.hasClass('is-narrow') && $target.hasClass('is-open')) {
                        $target.removeClass('is-open');
                        $target.find('.mark').text('開く');
                        $targetInner.removeClass('is-visible').addClass('is-hidden');
                        setTimeout(function () {
                            $targetContent.removeClass('is-visible').addClass('is-hidden');
                            $targetInner.removeClass('is-hidden');
                        }, duration);
                    } else if ($this.hasClass('is-narrow')) {
                        $hook.find('.mark').text('開く');
                        $target.find('.mark').text('閉じる');
                        switchContent();
                    }

                    setTimeout(function () {
                        isAnimation = false;
                    }, duration + buffer);
                });
            }

            function checkBP() {
                if (funcCheckSpView()) {
                    // SP
                    $this.addClass('is-narrow').removeClass('is-wide');
                    initNarrowTab();
                    moveContent();
                } else {
                    // PC
                    $this.addClass('is-wide').removeClass('is-narrow');
                    initWideTab();
                    moveContent();
                }
            }

            // 機能実行
            addMarkTxt();
            clickHandler();
            checkBP();

            $win.on('resize', function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    var $winWidthAfter = $win.outerWidth();

                    //  iOS対策
                    if ($winWidth !== $winWidthAfter) {
                        checkBP();
                    }
                }, 200);
            });
        });
    }());

    /* ====================
    ニュースリリース検索
    ==================== */
    (function () {
        var $root = $body.find('.box-newssearch-wrapper');

        if ($root.length === 0) {
            return;
        }

        function funcInit() {
            var $listSearchArea;
            var $inputCheckBoxLabel;
            var $btnSearchToggle;
            var checkBoxStatus;

            $listSearchArea = $root.find('.list-search-choice');
            $inputCheckBoxLabel = $listSearchArea.find('label');
            $btnSearchToggle = $root.find('.btn-search-toggle');

            if (!$btnSearchToggle.hasClass('open')) {
                $listSearchArea.hide();
            }

            //  検索フィールドトグル
            $btnSearchToggle.off('click.toggleSearchArea').on('click.toggleSearchArea', function () {
                var $selfBtn = $(this);

                duration = 300;
                $selfBtn.toggleClass('open');
                $listSearchArea.stop(true, true).slideToggle(duration, function () {
                    var $icon = $selfBtn.find('span');

                    if ($selfBtn.hasClass('open')) {
                        $icon.text('close');
                    } else {
                        $icon.text('open');
                    }
                });
            });
        }

        //  機能を実行
        funcInit();
    }());

    /* ====================
    トグルメニュー （sustainability TOPページ）
    ==================== */
    (function () {
        var $root = $('.list-accordion');
        var $targetToggle;

        if ($root.length === 0) {
            return;
        }

        $targetToggle = $root.find('button');
        $targetToggle.each(function () {
            var $selfToggle = $(this);
            var $icon = $selfToggle.find('.icon');

            $selfToggle.on('click.switchToggleContent', function () {
                $selfToggle.toggleClass('open');
                $selfToggle.next().slideToggle(300);

                if ($selfToggle.hasClass('open')) {
                    $icon.text('close');
                } else {
                    $icon.text('open');
                }
            });
        });
    }());

    /* ====================
    グローバルネットワークエリアプレビュー
    ==================== */
    (function () {
        var $root = $body.find('.box-preview-globalarea');
        var $imageArea;
        var $targetPanel;
        var $targetAfterPanel;
        var $btnClose;
        var btnCloseHtml = '<button class="btn-close" data-content-target="globalarea-normal">close panel</button>';
        var fadeDuration = 200;
        var funcChangeAreaImage;
        var funcChangeAfterPanel;

        if ($root.length === 0) {
            return;
        }

        $imageArea = $root.find('.box-image').find('img');
        $targetPanel = $root.find('.box-panel').find('.panel').off('click.moveAnchor');
        $targetAfterPanel = $root.find('.box-target-panel');

        // 閉じるボタンを生成・イベントを定義
        $targetAfterPanel.each(function () {
            var $selfAfterPanel = $(this);
            var $boxContent = $selfAfterPanel.find('.box-content');

            $boxContent.append(btnCloseHtml);
            $btnClose = $boxContent.find('.btn-close');
            $btnClose.attr('data-parent-id', $selfAfterPanel.attr('data-content-target'));

            $btnClose.on('click.closeGlobalAreaPanel', function () {
                var targetId = $(this).attr('data-content-target');
                var parentId = '#' + $(this).attr('data-parent-id');

                funcChangeAreaImage(targetId); // エリア画像の切り替え
                $targetAfterPanel.fadeOut(fadeDuration, function () {
                    // 元のパネルへフォーカス
                    $targetPanel.filter('[href="' + parentId + '"]').focus();
                });
            });
        });

        // エリア画像の切り替え処理
        funcChangeAreaImage = function (targetImageId) {
            var target;

            target = $imageArea.filter('[data-content-target="' + targetImageId + '"]');
            if (target.length === 0) {
                return;
            }

            $imageArea.hide();
            target.fadeIn(400);
        };

        // 対象のパネルを表示する処理
        funcChangeAfterPanel = function (targetPanelId) {
            var target;

            target = $targetAfterPanel.filter('[data-content-target="' + targetPanelId + '"]');
            if (target.length === 0) {
                return;
            }

            $targetAfterPanel.hide();
            target.fadeIn(fadeDuration, function () {
                $(this).find(focusable).eq(0).focus();
            });
        };

        // 初期処理
        $imageArea.hide();
        $imageArea.first().show();

        /*
        仕様メモ
        ・ 画像とパネルのコンテンツ切替は → data-content-target="ID" で切り替える（コンテンツにはIDも付与しておく）
        */
        // パネルのエリア切替処理
        $targetPanel.each(function () {
            var $selfPanel = $(this);

            $selfPanel.on('click.changeGlobalAreaPanel', function (e) {
                var $self = $(this);
                var hrefTargetId = $self.attr('href').replace('#', '');

                e.preventDefault();
                if (!funcCheckSpView()) {
                    // エリア画像の切り替え
                    funcChangeAreaImage(hrefTargetId);
                }
                // 対応したパネルの展開
                funcChangeAfterPanel(hrefTargetId);
            });
        });
    }());

    /* ====================
    PDFファイルサイズ取得プラグイン
    ==================== */
    (function ($) {
        $.fn.showFileSize = function () {
            this.each(function () {
                var $this = $(this);
                var contentLength = '';
                var url = $this.attr('href');
                var funcByteFormat = function (number) {
                    if (number > 1073741824) {
                        // GByte
                        number /= (1024 * 1024 * 1024);

                        return Math.ceil(number) + 'GB';
                    } else if (number > 1048576) {
                        // MByte
                        number /= (1024 * 1024);

                        return Math.ceil(number) + 'MB';
                    } else if (number > 1024) {
                        // KByte
                        number /= 1024;

                        return Math.ceil(number) + 'KB';
                    }

                    // byte
                    return Math.ceil(number) + 'B';
                };

                // 外部ドメインの絶対パスPDFリンク以外（内部リンクは相対パスで記載されているためこの条件式）
                if (/http.*/.test(url) || $this.hasClass('sizeAdded')) {
                    return;
                }

                // ファイルサイズを取得
                $.ajax({
                    method: 'HEAD',
                    url: url
                }).done(function (data, status, jqXHR) {
                    if (!$this.hasClass('sizeAdded')) {
                        contentLength = funcByteFormat(jqXHR.getResponseHeader('Content-Length'));

                        if ($this.find('.text').length) {
                            $this.find('.text').append(' (' + contentLength + ')');
                        } else if ($this.find('.title').length) {
                            $this.find('.title').append(' (' + contentLength + ')');
                        } else {
                            $this.append(' (' + contentLength + ')');
                        }

                        $this.addClass('sizeAdded');
                    }
                }).fail(function (err) {
                    console.log(err);　// eslint-disable-line
                });
            });
        };
    }(jQuery));　// eslint-disable-line

    /* ====================
    * body内にあるPDFリンクのファイルサイズを取得
    * ==================== */
    (function () {
        $win.on('load', function () {
            var $linkPdf = $('body').find('a[href$=".pdf"]').not('.notAddSize');

            if ($linkPdf.length) {
                $linkPdf.showFileSize();
            }
        });
    }());

    /* ========================================
    * ニュースリリース機能
    * ======================================== */
    $(function () {
        var NewsRelease;
        var LIST_TYPE = {
            top: 2,
            newsRelease: 1
        };
        var MORE_ITERATION = {
            default: 'infinite',
            once: 'once'
        };
        var LIST_NUM = 100;
        var TOP_NEWS = {
            name: '._sectionNews ._sectionNews-inner .top-news',
            listNum: 3,
            listType: 1,
            mountTime: 200,
            moreIteration: 'once',
            kkcAnimation: false
        };
        var MEDIA_CENTER = {
            name: '.str-section-wrapper.mediacenter-01 .box-panel-01',
            listNum: 8,
            listType: 2,
            mountTime: 200,
            moreIteration: 'once',
            moreBtnElm: '.btn-more',
            kkcAnimation: true
        };
        var NEWS_RELEASE = {
            name: '.box-newssearch-wrapper .box-content[data-page="news_release"]',
            listNum: 10,
            mountTime: 200,
            showYear: true,
            listLenElm: '.box-newssearch-wrapper .text-result-num',
            filterElm: '.list-search-choice',
            moreBtnElm: '.btn-more'
        };
        var NEWS_RELEASE_YEAR = {
            name: '.box-newssearch-wrapper .box-content[data-filter]',
        };

        NewsRelease = function () {
            this.dataURL = '/media_center/share/json/release.json';
            this.test = false; // リストにカテゴリー番号を表示するかどうか
            this.kkcAnimation = false; // kkc-animationを有効にするかどうか
            this.data = null; // 元データ
            this.preData = null; // 整形済みデータ
            this.checkedItems = []; // 選択しているフィルタリング項目
            this.displayedYearHdg = []; // 画面に表示されている年の見出し
            this.mountObj = null; // 出力先要素の情報
            this.$mountElm = null; // リスト描画先要素
            this.listType = LIST_TYPE.newsRelease; // 表示されるリストタイプ
            this.listNum = LIST_NUM; // 表示されるリスト数
            this.mountTime = 0; // リスト描画時間
            this.showYear = false; // 見出し表示非表示
            this.moreIteration = MORE_ITERATION.default; // もっと見るボタンの表示回数
            this.$filterElm = null; // フィルタリング用チェックボックス要素
            this.$moreBtnElm = null; // もっとみるボタン要素
            this.$listLenElm = null; // 検索結果表示用要素

            this.init();
        };

        NewsRelease.prototype = {
            /**
             * 初期処理
             * @returns {Undefined} undefined
             */
            init: function() {
                var self = this;

                this.mountObj = this.getMountObj([TOP_NEWS, MEDIA_CENTER, NEWS_RELEASE, NEWS_RELEASE_YEAR]);

                if (this.mountObj) {
                    $.ajax({
                        url: this.dataURL,
                        type: 'GET',
                        dataType: 'json'
                    }).done(function (data) {
                        self.initMountObj(data);
                        self.initElmEvent();

                        self.data = data;
                        self.preData = self.descSort(self.filter2Data(self.data));
                        self.mount(self.createListElmData(self.preData));
                    });
                }
            },
            /**
             * 引数で送られた要素が画面上に存在しているか検索、1つでも存在を確認すればその要素の情報を返し処理を終了させる
             * @param {Array} mountObjArr [{name: 'cssSelector', listType: 1, listNum: 10, option: { mountTime: 200, showYear: true, listLenElm: '.mod-box-text-result', filterElm: '.mod-box-search', moreBtnElm: '.show-more'}]
             * @returns {Object} 要素情報
             */
            getMountObj: function(mountObjArr) {
                var returnObj = false;

                mountObjArr.some(function (obj) {
                    if ($(obj.name).length) {
                        returnObj = obj;

                        return true;
                    }

                    return false;
                });

                return returnObj;
            },
            /**
             * mountObjの情報を元にthisの初期処理を行う
             * @returns {Undefined} undefined
             */
            initMountObj: function() {
                var mountObj = this.mountObj;

                this.$mountElm = $(mountObj.name);

                // kkcAnimation
                if (mountObj.hasOwnProperty('kkcAnimation')) {
                    this.kkcAnimation = mountObj.kkcAnimation;
                }
                // listType
                if (mountObj.hasOwnProperty('listType')) {
                    this.listType = mountObj.listType;
                }
                // listNum
                if (mountObj.hasOwnProperty('listNum')) {
                    this.listNum = mountObj.listNum;
                }
                // mountTime
                if (mountObj.hasOwnProperty('mountTime')) {
                    this.mountTime = mountObj.mountTime;
                }
                // showYear
                if (mountObj.hasOwnProperty('showYear')) {
                    this.showYear = mountObj.showYear;
                }
                // moreIteration
                if (mountObj.hasOwnProperty('moreIteration')) {
                    this.moreIteration = mountObj.moreIteration;
                }
                // filterElm
                if (mountObj.hasOwnProperty('filterElm')) {
                    this.$filterElm = $(mountObj.filterElm).find('input[type="checkbox"]');
                }
                // $resetBtnElm
                if (mountObj.hasOwnProperty('filterElm')) {
                    this.$resetBtnElm = $(mountObj.filterElm).find('button');
                }
                // listLenElm
                if (mountObj.hasOwnProperty('listLenElm')) {
                    this.$listLenElm = $(mountObj.listLenElm);
                }
                // moreBtnElm
                if (mountObj.hasOwnProperty('moreBtnElm') && this.mountObj.listNum !== 'all') {
                    this.$moreBtnElm = $(mountObj.moreBtnElm);
                }
            },
            /**
             * 要素にイベントを追加
             * @returns {Undefined} undefined
             */
            initElmEvent: function() {
                var self = this;

                // filterElm
                if (this.$filterElm) {
                    this.$filterElm.on('change', function() {
                        self.filterElmOnChange($(this));
                    });
                }
                // resetBtnElm
                if (this.$resetBtnElm) {
                    this.$resetBtnElm.on('click', function() {
                        self.resetBtnElmOnClick();
                    });
                }
                // moreBtnElm
                if (this.$moreBtnElm) {
                    this.$moreBtnElm.on('click', function () {
                        self.moreBtnElmOnClick($(this));
                    });
                }
            },
            /**
             * チェックボックスの状態変更時処理
             * @returns {Undefined} undefined
             */
            filterElmOnChange: function ($input) {
                this.preData = this.descSort(this.filter2Data(this.data));
                this.mount(this.createListElmData(this.preData));
                this.checkboxValidate($input);
            },
            /**
             * リセットボタンクリック時処理
             * @returns {Undefined} undefined
             */
            resetBtnElmOnClick: function () {
                this.resetFilterData(true);
                this.preData = this.descSort(this.data);
                this.mount(this.createListElmData(this.preData));
            },
            /**
             * もっと読むボタンクリック時処理
             * @returns {Undefined} undefined
             */
            moreBtnElmOnClick: function ($this) {
                this.mount(this.createListElmData(this.preData, true), true);
                if (this.moreIteration === 'once') {
                    $this.hide();
                }
            },
            /**
             * 引数で送られたデータをチェックボックスの値を元にフィルタリングする
             * @param {Object} data リストのデータ
             * @returns {Object} フィルタリング後のデータ
             */
            filter2Data: function(data) {
                var newData = [];
                var dataI = 0;
                var dataLen = 0;
                var dataItem = {};
                var checkedItems = [];
                var checkedItemsI = 0;
                var checkedItemsLen = 0;
                var checkedItemsItem = {};
                var categoryJudgeArr = [];
                var yearJudgeArr = [];
                var $mountElm = this.$mountElm;
                var InputNameOfYear = 'year';
                var InputNameOfCategory = 'category';
                var InputNameOfNone = 'none';

                // フィルタリング要素が存在しない且つ、data-filter属性が無い場合はデータをそのまま返す
                if (!this.$filterElm && !$mountElm.data('filter')) {
                    return data;
                }

                this.resetFilterData();
                checkedItems = this.getCheckedItem();

                // フィルタリングする項目が存在しない場合はデータをそのまま返す
                if (!checkedItems.length) {
                    return data;
                }

                // フィルタリング
                for (dataI = 0, dataLen = data.length; dataI < dataLen; dataI++) {
                    dataItem = data[dataI];
                    categoryJudgeArr = [];
                    yearJudgeArr = [];

                    // checkedItems（フィルタリングする項目が入った配列）を元に、リストデータを取得するか判定
                    for (checkedItemsI = 0, checkedItemsLen = checkedItems.length; checkedItemsI < checkedItemsLen; checkedItemsI++) {
                        checkedItemsItem = checkedItems[checkedItemsI];

                        // フィルタリング項目が西暦の場合は値をそのままyearJudgeArrにpush
                        if (checkedItemsItem.name === InputNameOfYear || checkedItemsItem.name === InputNameOfNone) {
                            yearJudgeArr.push(checkedItemsItem.value);
                        // フィルタリングする項目がデータに含まれている場合はtrue,含まれていない場合はfalseをcategoryJudgeArrにpush
                        } else if (checkedItemsItem.name === InputNameOfCategory) {
                            if (dataItem.category.indexOf(checkedItemsItem.value) >= 0) {
                                categoryJudgeArr.push(true);
                            } else {
                                categoryJudgeArr.push(false);
                            }
                        // 意図せずnameを間違えてしまったとき（タイプミス）のエラー処理
                        } else {
                            throw new Error('input[name] error:', checkedItemsItem.name);
                        }
                    }

                    // 1. 西暦のチェックボックスのみ選択されている場合
                    // 2. カテゴリのチェックボックスのみ選択されている場合
                    // 3. 両方選択されている場合
                    // 上記のいずれかがtrueの場合はnewDataにdataItemをpushする
                    if ((!categoryJudgeArr.length && yearJudgeArr.indexOf(dataItem.date.year) >= 0) ||
                        (!yearJudgeArr.length && categoryJudgeArr.indexOf(true) >= 0) ||
                        (categoryJudgeArr.indexOf(true) >= 0 && yearJudgeArr.indexOf(dataItem.date.year) >= 0)) {
                        newData.push(dataItem);
                    }
                }

                return newData;
            },
            /**
             * フィルタリングする項目（選択されているチェックボックスのValue値）を取得する
             * @returns {Array} 選択されているチェックボックスのValue値が入った配列
             */
            getCheckedItem: function () {
                var self = this;
                var checkedItems = [];

                // 描画用要素にフィルタリングする項目データが設定されている場合はその値をcheckedItemsにpush
                if (this.$mountElm.data('filter')) {
                    checkedItems.push({
                        name: 'none',
                        value: String(this.$mountElm.data('filter'))
                    });
                } else {
                    this.$filterElm.each(function () {
                        var $this = $(this);

                        if ($this.prop('checked')) {
                            checkedItems.push({
                                name: $this.attr('name'),
                                value: $this.val()
                            });
                            self.checkedItems.push({
                                name: $this.attr('name'),
                                value: $this.val()
                            });
                        }
                    });
                }

                return checkedItems;
            },
            /**
             * フィルタリング情報をリセットする
             * @param {Boolean} allReset trueの場合は選択されている項目のchecked属性をfalseにする
             * @returns {Undefined} undefined
             */
            resetFilterData: function (allReset) {
                var $mountElm = this.$mountElm;
                var mountTime = this.mountTime;

                if ($mountElm.find(':not(noscript)').length && mountTime) {
                    $mountElm.fadeOut(mountTime);

                    setTimeout(function () {
                        $mountElm.empty();
                    }, mountTime);
                } else {
                    $mountElm.empty();
                }
                this.displayedYearHdg = [];
                this.checkedItems = [];

                if (allReset) {
                    this.$filterElm.each(function () {
                        var $this = $(this);

                        $this.prop('disabled', false);
                        $this.prop('checked', false);
                    });
                }
            },
            /**
             * データを降順に並べ替える
             * @param {Object} data リストのデータ
             * @returns {Object} 降順に並び替えられたリストデータ
             */
            descSort: function (data) {
                var newData = JSON.parse(JSON.stringify(data));

                newData.sort(function (a, b) {
                    let aYear = a.date.year;
                    let aMonth = a.date.month.length > 1 ? a.date.month : '0' + a.date.month;
                    let aDay = a.date.day.length > 1 ? a.date.day : '0' + a.date.day;
                    let bYear = b.date.year;
                    let bMonth = b.date.month.length > 1 ? b.date.month : '0' + b.date.month;
                    let bDay = b.date.day.length > 1 ? b.date.day : '0' + b.date.day;

                    return (bYear + bMonth + bDay) - (aYear + aMonth + aDay);
                });

                return newData;
            },
            /**
             * 送られてきたリストデータを文字列のHTMLに変換する
             * @param {Object} data リストのデータ
             * @param {Boolean} moreBtnFlg もっとみるボタンが押下された場合のフラグ
             * @returns {String} 文字列のHTML
             */
            createListElmData: function(data, moreBtnFlg) {
                var tmpHeading = '';
                var tmpType1 = '';
                var tmpType2 = '';
                var listElmTmp = ''; // 文字列のHTML
                var dataI = 0; // データのindex番号
                var dataLen = 0; // データの表示数
                var dataItem = {}; // データ
                var $listLenElm = this.$listLenElm;
                var enMonthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                var testNumberStr = '';
                var testNumber = {
                    'Corporate': 10,
                    'Product': 11,
                    'R&D': 12,
                    'Sustainability': 13,
                    'Fujifilm Kyowa Kirin Biologics': 14,
                    'Others': 15,
                    'Japan': 20,
                    'North America': 21,
                    'EMEA': 22,
                    'Asia・Pacific': 23
                };

                if (this.checkedItems.length) {
                    dataI = 0;
                    dataLen = data.length;
                } else {
                    // moreボタンが押下された場合の処理
                    if (moreBtnFlg) {
                        // 画面に表示されているリストの数を代入
                        dataI = this.$mountElm.find('[data-newsList]').length;

                        // データの数と表示されているリスト + 任意の表示数を比較してデータの数が多い場合は、
                        // 次に表示するデータが存在すると判定し、dataLenに表示されているリスト + 任意の表示数を代入
                        if (data.length >= dataI + this.listNum) {
                            dataLen = dataI + this.listNum;

                        // データの数と表示されているリスト + 任意の表示数を比較してデータの数が少ない場合は、
                        // 次に表示するデータが存在しないと判定し、dataLenに表示されているリスト + (データ数 - 表示されているリスト数)を代入
                        } else if (data.length <= dataI + this.listNum) {
                            dataLen = dataI + (data.length - dataI);
                        }
                    } else {
                        dataI = 0;
                        dataLen = data.length <= this.listNum ? data.length : this.listNum;
                    }
                }

                // 1. moreボタンが存在していて且つ、次に表示するデータが存在しない場合はmoreボタンを非表示にする
                // 2. moreボタンが存在していて且つ、フィルタリング項目を選択している場合
                if ((this.$moreBtnElm && data.length <= dataI + this.listNum) ||
                    (this.$moreBtnElm && this.checkedItems.length)) {
                    this.$moreBtnElm.hide();
                } else if (this.$moreBtnElm && !this.checkedItems.length) {
                    this.$moreBtnElm.show();
                }

                // リストの表示件数を表示
                if ($listLenElm) {
                    $listLenElm.text(this.preData.length);
                }

                // リストデータの生成
                for (; dataI < dataLen; dataI++) {
                    dataItem = data[dataI];

                    // リストの最初に見出しを表示
                    if (this.showYear) {
                        if (this.displayedYearHdg.indexOf(dataItem.date.year) < 0) {
                            tmpHeading = '<h3 class="hdg-lv3-01">' + dataItem.date.year + '</h3>';
                            listElmTmp += tmpHeading.replace('{{year}}', dataItem.date.year);
                            this.displayedYearHdg.push(dataItem.date.year);
                        }
                    }

                    if (this.listType === 1) {
                        tmpType1 = '<div data-newsList="1" class="panel-news">{{test}}<dl class="panel-info"><dt class="title">{{month}} {{day}}, {{year}}</dt><dd class="link">{{link}}</dd><!-- /.panel-info --></dl><!-- /.panel-news --></div>';
                        tmpType1 = tmpType1.replace(/{{year}}/g, dataItem.date.year);
                        tmpType1 = tmpType1.replace(/{{month}}/g, enMonthName[parseInt(dataItem.date.month - 1)]);
                        tmpType1 = tmpType1.replace(/{{day}}/g, dataItem.date.day);
                        if (!dataItem.type || dataItem.type === 'normal') {
                            tmpType1 = tmpType1.replace(/{{link}}/g, '<a href="' + dataItem.url + '">' + dataItem.ttl + '</a>');
                        } else if (dataItem.type === 'blank') {
                            tmpType1 = tmpType1.replace(/{{link}}/g, '<a href="' + dataItem.url + '" target="_blank">' + dataItem.ttl + '<img src="/share/images/icon_link_blank_07.png" alt="Open in new window" class="icon-blank"></a>');
                        } else if (dataItem.type === 'pdf') {
                            tmpType1 = tmpType1.replace(/{{link}}/g, '<a href="' + dataItem.url + '" target="_blank">' + dataItem.ttl + '<img src="/share/images/icon_pdf_blank_05.png" alt="PDF file" class="icon-pdf"></a>');
                        }
                        if (this.test) {
                            testNumberStr = '';

                            dataItem.category.forEach(function (val, idx) {
                                var categoryLen = dataItem.category.length;

                                testNumberStr += (idx + 1) < categoryLen ? testNumber[val] + ', ' : testNumber[val];
                            });

                            tmpType1 = tmpType1.replace(/{{test}}/g, '<div>' + testNumberStr + '</div>');
                        } else {
                            tmpType1 = tmpType1.replace(/{{test}}/g, '');
                        }
                        listElmTmp += tmpType1;
                    } else if (this.listType === 2) {
                        tmpType2 = '<a data-newsList="2" href="{{url}}" {{target}} class="panel kkc-anime_scroll_common_fade-in-bottom"><div class="box-inner">{{test}}<div class="box-content"><h3 class="title">{{ttl}}</h3><div class="box-date"><p><em>{{day}} {{month}} {{year}}</em>{{icon}}</p></div><!-- /.box-content --></div>{{img}}<!-- /.box-inner--></div><!-- /.panel --></a>';
                        tmpType2 = tmpType2.replace(/{{url}}/g, dataItem.url);
                        if (dataItem.type === 'blank' || dataItem.type === 'pdf') {
                            tmpType2 = tmpType2.replace(/{{target}}/g, 'target="_blank"');
                        } else {
                            tmpType2 = tmpType2.replace(/{{target}}/g, '');
                        }
                        tmpType2 = tmpType2.replace(/{{ttl}}/g, dataItem.ttl);
                        tmpType2 = tmpType2.replace(/{{day}}/g, dataItem.date.day);
                        tmpType2 = tmpType2.replace(/{{month}}/g, enMonthName[parseInt(dataItem.date.month - 1)]);
                        tmpType2 = tmpType2.replace(/{{year}}/g, dataItem.date.year);
                        if (!dataItem.type || dataItem.type === 'normal') {
                            tmpType2 = tmpType2.replace(/{{icon}}/g, '');
                        } else if (dataItem.type === 'blank') {
                            tmpType2 = tmpType2.replace(/{{icon}}/g, '<div class="icon-blank"><span>Open in new window</span></div>');
                        } else if (dataItem.type === 'pdf') {
                            tmpType2 = tmpType2.replace(/{{icon}}/g, '<div class="icon-pdf"><span>PDF file</span></div>');
                        }
                        if (dataItem.img !== '') {
                            tmpType2 = tmpType2.replace(/{{img}}/g, '<div class="box-image"><img src="' + dataItem.img + '" alt="sample"></div>');
                        } else {
                            tmpType2 = tmpType2.replace(/{{img}}/g, '');
                        }
                        if (this.test) {
                            testNumberStr = '';

                            dataItem.category.forEach(function (val, idx) {
                                var categoryLen = dataItem.category.length;

                                testNumberStr += (idx + 1) < categoryLen ? testNumber[val] + ', ' : testNumber[val];
                            });

                            tmpType2 = tmpType2.replace(/{{test}}/g, '<div>' + testNumberStr + '</div>');
                        } else {
                            tmpType2 = tmpType2.replace(/{{test}}/g, '');
                        }
                        listElmTmp += tmpType2;
                    }
                }

                return listElmTmp;
            },
            /**
             * チェックボックスのバリデートを行い、選択すると検索結果が0になるチェックボックスを非活性にする
             * @param {Object} $input 押下したチェックボックス
             * @returns {Undefined} undefined
             */
            // チェックボックスの活性非活性の切り替え
            checkboxValidate: function ($input) {
                if ($input.attr('name') === 'category') {
                    this.validate($input, this.validateYear(this.getSelectedData('category')));
                } else if ($input.attr('name') === 'year') {
                    this.validate($input, this.validateCategory(this.getSelectedData('year')));
                }
            },
            /**
             * チェックボックスの活性、非活性の切り替え
             * @param {HTMLElement} $input 押下したinput要素
             * @param {Array} existData 存在するデータ名（カテゴリ or 年）
             * @returns {Undefined} undefined
             */
            validate: function ($input, existData) {
                this.$filterElm.each(function () {
                    var $this = $(this);
                    var name = $this.attr('name');
                    var val = $this.val();

                    if ($input.attr('name') !== name) {
                        // 全ての選択を解除した場合
                        if (!existData.length) {
                            $this.prop('disabled', false);

                            return;
                        }

                        if (existData.indexOf(val) >= 0) {
                            $this.prop('disabled', false);
                        } else {
                            $this.prop('disabled', true);
                        }
                    }
                });
            },
            /**
             * 押下したチェックボックスと同じname属性を持っている且つ、選択されているチェックボックスのvalueを返す
             * @param {String} inputName 選択したチェックボックスのname属性値
             * @returns {Array} 押下したチェックボックスと同じname属性を持っている且つ、選択されているチェックボックスのvalue
             */
            getSelectedData: function (inputName) {
                var returnArr = [];

                // selectedAllに選択しているデータをpush
                this.$filterElm.each(function () {
                    var $this = $(this);
                    var name = $this.attr('name');
                    var val = $this.val();

                    if (name === inputName) {
                        if ($this.prop('checked')) {
                            returnArr.push(val);
                        }
                    }
                });

                return returnArr;
            },
            /**
             * カテゴリーのバリデートを行い選択された年に存在するカテゴリー名を配列で返す
             * @param {Array} selectedAll 押下されているチェックボックス（年）
             * @returns {Array} 選択された年に存在するカテゴリー名を配列で返す
             */
            validateCategory: function (selectedAll) {
                var data = this.data;
                var dataI = 0;
                var dataLen = data.length;
                var dataItem = {};
                var existCategory = [];
                var setExistYearData = function () {
                    // データの年が選択されている年と同じの場合はそのデータのカテゴリをexistCategoryにpush
                    if (selectedAll.indexOf(dataItem.date.year) >= 0) {
                        dataItem.category.forEach(function (category) {
                            // existCategoryに同じカテゴリが存在しない場合のみpush
                            if (existCategory.indexOf(category) < 0) {
                                existCategory.push(category);
                            }
                        });
                    }
                };

                for (; dataI < dataLen; dataI++) {
                    dataItem = data[dataI];

                    setExistYearData();
                }

                return existCategory;
            },
            /**
             * 年のバリデートを行い選択されたカテゴリーに存在する年名を配列で返す
             * @param {Array} selectedAll 押下されているチェックボックス（カテゴリー）
             * @returns {Array} 選択された年に存在する年名を配列で返す
             */
            validateYear: function (selectedAll) {
                var data = this.data;
                var dataI = 0;
                var dataLen = data.length;
                var dataItem = {};
                var existYear = [];
                var setExistCategoryData = function (category) {
                    // データのカテゴリが選択されているカテゴリと同じ場合はそのデータの年をexistYearにpush
                    if (selectedAll.indexOf(category) >= 0) {
                        // existYearに同じ年が存在しない場合のみpush
                        if (existYear.indexOf(dataItem.date.year) < 0) {
                            existYear.push(dataItem.date.year);
                        }
                    }
                };

                for (; dataI < dataLen; dataI++) {
                    dataItem = data[dataI];

                    dataItem.category.forEach(setExistCategoryData);
                }

                return existYear;
            },
            /**
             * 引数で送られてきた文字列のHTMLを描画する
             * @param {String} stringHTMLData 文字列のHTML
             * @param {Boolean} diffFlg 差分のみ描画するかどうか
             * @returns {Undefined} undefined
             */
            mount: function (stringHTMLData, diffFlg) {
                var $mountElm = this.$mountElm;
                var mountTime = this.mountTime;
                var $listElm = $(stringHTMLData);

                if ($mountElm.find(':not(noscript)').length && mountTime) {
                    if (diffFlg) {
                        $mountElm.append($listElm);
                        $listElm.hide().fadeIn(mountTime);
                        $listElm.find('a').setOutboundModal();

                        if ($listElm.find('a[href$=".pdf"]').length) {
                            $listElm.find('a[href$=".pdf"]').showFileSize();
                        }
                    } else {
                        $mountElm.fadeOut(mountTime);

                        setTimeout(function () {
                            $mountElm.append($listElm);
                            $mountElm.hide().fadeIn(mountTime);
                            $mountElm.find('a').setOutboundModal();

                            if ($mountElm.find('a[href$=".pdf"]').length) {
                                $mountElm.find('a[href$=".pdf"]').showFileSize();
                            }
                        }, mountTime);
                    }
                } else {
                    $mountElm.append($listElm);
                    $mountElm.find('a').setOutboundModal();

                    if ($mountElm.find('a[href$=".pdf"]').length) {
                        $mountElm.find('a[href$=".pdf"]').showFileSize();
                    }
                }

                if (this.kkcAnimation) {
                    window.kkcAnimation.unsetEvOfAnimationEl($win)
                    window.kkcAnimation.unsetScrollEv($win);
                    window.kkcAnimation.unsetResizeEv($win);
                    window.kkcAnimation.fetchAnimationEl();
                    window.kkcAnimation.init();
                }
            }
        };

        window.NewsRelease = new NewsRelease();
    });

    /* ====================
    * TOPページ in-numbersセクションの処理
    * ==================== */
    (function () {
        var $main = $('main');
        var $animationToggleBtn = $('.animation-toggle-btn');
        var $inNumberItem = $('.innumber-item'); // 流れてる数字
        var $inNumberActiveWindow = null // 数字を押したときに表示されるwindow
        var $selectedItem = null;  // 選択した数字
        var d = new $.Deferred();
        /**
         * 数字を押したときに表示されたwindowを閉じる処理
         * @param {Event} e クリックイベント
         */
        var closeActiveWindow = function (e) {
            if ($inNumberActiveWindow.hasClass('active')) {
                var $target = e.data.$target;

                $inNumberItem.removeAttr('tabindex').removeClass('inactive');
                $inNumberActiveWindow.removeClass('active');
                $target.removeClass('active');

                // in-numbers内をクリックしてactive-windowを閉じた場合のみフォーカスを戻す
                if ($(e.target).closest('.innumbers-active-window').length) {
                    $selectedItem.focus();
                }

                $main.off('click', closeActiveWindow);
            }
        };

        $inNumberItem.on('click', function () {
            var $this = $(this);
            var data = $this.data('name');
            var $target = $('.' + data);
            var $targetImg = $target.find('.active-img');
            var targetSrc = '';
            var mainProcess = function () {
                $selectedItem = $this;
                $inNumberActiveWindow = $this.siblings('.innumbers-active-window');
                $this.parent().find('.innumber-item').attr('tabindex', -1).addClass('inactive');
                $inNumberActiveWindow.addClass('active');

                // $targetImgのダミー画像を正規の画像に切り替える
                if (!$targetImg.hasClass('loaded')) {
                    targetSrc = $targetImg.data('src');

                    $targetImg.attr('src', targetSrc).addClass('loaded');
                }

                $target.addClass('active').focus();
                d.resolve();

                return d.promise();
            };

            mainProcess().then(function () {
                $main.on('click', {$target: $target}, closeActiveWindow);
            });
        });

        $animationToggleBtn.on('click', function () {
            var $this = $(this);
            var $text = $this.find('span');

            $text.text($this.hasClass('paused') ? 'pause' : 'play');
            $this.toggleClass('paused');
            $inNumberItem.toggleClass('paused');
        });
    }());
}());
