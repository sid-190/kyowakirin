$(function () {
    'use strict';

    var $win = $(window);
    var $body = $('body');
    var FOCUS_ELEMENTS = 'a[href], area[href], [tabindex], button, input, select, textarea, iframe, object, audio, video, output, embed';

    /* ========================================
    * 外部サイト遷移時モーダル機能プラグイン
    * ======================================== */
    (function ($) {
        var whiteListHost = [ // モーダルを表示させないhostname + directore
            'www.kyowa-kirin.co.jp',
            'www.kyowa-kirin.com',
            'ir.kyowa-kirin.com/en',
            'www.kyowakirin.com',
            'www.kyowakirin.co.jp',
            'ir.kyowakirin.com/en',
            'm.kirin.co.jp',
        ];
        var whiteListFile = []; // モーダルを表示させないファイル
        var exceptionList = [ // 例外URL: モーダルのタイプ
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/tw/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/kkr/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/hk/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/kr/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/thailand/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/biowa/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/kkd/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/malaysia/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/asiapacific/*',
                type: 'type01'
            },
            {
                hostname: 'www.kyowakirin.com',
                pathname: '/australia/*',
                type: 'type01'
            }
        ];
        var modalTmp = '<div class="box-modal-outbound"><div class="box-modal-inner"><div class="modal-tmp"></div><button class="btn-modal-close" type="button"><span class="radius"><span>Close</span></span></button></div>';
        var modalContentTmp = {
            type01: '<div class="box-text"><p>You will be accessing an external site.</p><p>Click "OK" to continue.</p></div><div class="align-c"><a href="{{href}}" target="_blank" class="btn-03 btn-small">OK<img src="/share/images/icon_link_blank_04.png" alt="Open in new window" class="icon-blank"></a></div>',
            type02: '<div class="box-text"><p><em>Président</em></p><p>Emilie Bugeat-Toussaint</p><p><em>Pour toute déclaration d’effet indésirable, contactez</em></p><p>pvfrance@kyowakirin.com</p><p><em>Pour toute demande d’information médicale, contactez</em></p><p>infomedfr@kyowakirin.com</p></div><div class="box-text mb-0"><p>Kyowa Kirin Pharma est certifié pour son activité d’information par démarchage ou prospection visant à la promotion des médicaments.</p><p>Pour toute appréciation sur la qualité de notre information promotionnelle, contactez pharmaceutique-fr@kyowakirin.com.</p></div>',
            type03: '<div class="box-text mb-0"><p>Kyowa Kirin USA Holdings, Inc.</p><p>Address	212 Carnegie Center, Suite 400, Princeton, NJ 08540 USA</p><p>Tel	+1-609-580-7400</p><p>Fax	+1-609-919-1111</p></div>'
        };
        var modalOverlayTmp = '<div class="box-modal-overlay is-hidden" aria-hidden="true"></div>';
        var $modal = null;
        var $modalContent = null;
        var $modalOverlay = null;
        var $focusElement = null;
        var $clickedLink = null;
        var deferred = new $.Deferred();
        var isWhite = function (href) {
            var returnBoolean = false;
            var paths = location.pathname.split('/');
            var currentFile = paths[paths.length - 1] === '' ? 'index.html' : paths[paths.length - 1];
            var currentFileReg = {};

            if (/^(https?:)?(\/\/).*/.test(href)) {
                if (/[^/]$/.test(href)) {
                    href += '/';
                }

                whiteListFile.forEach(function (val) {
                    currentFileReg = new RegExp(val.replace(/\//g, '\\/').replace(/\*/g, '\\*').replace(/\./g, '\\.'));

                    if (currentFileReg.test(currentFile)) {
                        returnBoolean = true;
                    }
                });

                // 無駄な処理を省くためにreturnBooleanがfalseの時のみ動く
                if (!returnBoolean) {
                    whiteListHost.forEach(function (val) {
                        // 絶対パスか同じスキーマ
                        var reg = new RegExp('^(https?:)?\\/\\/' + val.replace(/\//g, '\\/').replace(/\*/g, '\\*').replace(/\./g, '\\.') + '(?=\\/)');

                        if (reg.test(href)) {
                            returnBoolean = true;
                        }
                    });
                }
            } else {
                returnBoolean = true;
            }

            return returnBoolean;
        };
        var exceptionProcess = function (href, returnType) {
            var forced = { // 例外モーダルを強制的に発生させるhref: モーダルタイプ
                '#outBoundModal-exception-01': 'type01',
                '#outBoundModal-exception-02': 'type02',
                '#outBoundModal-exception-03': 'type03',
            }[href];
            var value = null;
            var hostname = 'www.kyowakirin.com';
            // @TODO ホストネームを固定しない場合は上記変数を削除して下記の変数のコメントアウトを解除
            // var hostname = location.hostname;
            var pathname = location.pathname.replace(/(index\.html)$/, '');
            var paths = '';
            var downDirLen = 0;

            if (returnType === 'boolean') {
                value = false;
            } else if (returnType === 'type') {
                value = 'type01';
            } else {
                returnType = 'boolean';
                value = false;
            }

            if (/^#/.test(href)) {
                if (forced) {
                    if (returnType === 'boolean') {
                        return true
                    } else if (returnType === 'type') {
                        return forced;
                    }
                } else {
                    return false;
                }
            }

            // 末尾がindex.htmlではない場合は/index.htmlを付ける
            // 末尾に/が無い且つ、末尾がindex.htmlではない場合は/index.htmlを付ける
            if (/[^/]$/.test(href) && !/(index\.html)$/.test(href)) {
                href += '/index.html';
            }
            // 末尾が/の場合はindex.htmlを付ける
            href = /\/$/.test(href) ? href + 'index.html' : href;

            // 絶対パスか同じスキーマ
            if (/^(https?:)?(\/\/).*/.test(href)) {
                hostname = href.replace(/^(https?:)?(\/\/)/, '').replace(/\/.*/, '');
                pathname = href.replace(/^(https?:)?(\/\/)(.*?)(?=\/)/, '');
            // 相対パス(./ || ../または/で始まらないリンク)
            } else if (/^[.]{1}(?=\/).*/.test(href) || /^(?!([.]{2})?\/).*/.test(href)) {
                pathname += href.replace(/^([.]{1}\/)/, '');
            // 相対パス（階層を下がる）
            } else if (/^[.]{2}(?=\/).*/.test(href)) {
                paths = pathname.match(/(.*?)\//g);
                downDirLen = href.match(/\.\.\//g).length;

                while (downDirLen--) {
                    paths.pop();
                }
                pathname = paths.join('') + href.replace(/[.]{2}\//g, '');
            // ルート相対パス
            } else if (/^\/.*/.test(href)) {
                pathname = href;
            }

            exceptionList.forEach(function (item) {
                var checkePathReg = new RegExp('^' + item.pathname.replace(/\//g, '\\/').replace(/\*/g, '\\*').replace(/\./g, '\\.'));
                var forwardMatchReg = {};

                if (!checkePathReg.test(location.pathname)) {
                    // 末尾に/が無い場合は/index.htmlを付ける
                    item.pathname = /!\/$/.test(item.pathname) ? item.pathname + '/index.html' : item.pathname;
                    // 末尾が/の場合はindex.htmlを付ける
                    item.pathname = /\/$/.test(item.pathname) ? item.pathname + 'index.html' : item.pathname;
                    if (hostname === item.hostname) {
                        // 前方一致
                        if (/\*$/.test(item.pathname)) {
                            forwardMatchReg = new RegExp('^' + item.pathname.replace(/\*/, '').replace(/\//g, '\\/').replace(/\*/g, '\\*').replace(/\./g, '\\.'));

                            if (forwardMatchReg.test(pathname)) {
                                if (returnType === 'boolean') {
                                    value = true;
                                } else if (returnType === 'type') {
                                    value = item.type;
                                }
                            }
                        // 完全一致
                        } else if (pathname === item.pathname) {
                            if (returnType === 'boolean') {
                                value = true;
                            } else if (returnType === 'type') {
                                value = item.type;
                            }
                        }
                    }
                }
            });

            return value;
        };
        var isException = function (href) {
            return exceptionProcess(href, 'boolean');
        };
        var getModalType = function (href) {
            return exceptionProcess(href, 'type');
        };
        var init = function () {
            if ($modal === null || $modalOverlay === null) {
                if (!$('.box-modal-outbound').length) {
                    $('body').append($(modalTmp));

                    $modal = $('.box-modal-outbound');
                }

                if (!$('.box-modal-overlay').length) {
                    $('body').append($(modalOverlayTmp));

                    $modalOverlay = $('.box-modal-overlay');
                }
            }
        };
        var modalShow = function (e) {
            var scrollTop = $win.scrollTop();
            var $this = e.data.$this;
            var href = e.data.href;

            e.preventDefault();

            $focusElement = $(FOCUS_ELEMENTS).not('.btn-modal-close');
            $modalContent = $(modalContentTmp[getModalType(href)].replace(/\{\{href\}\}/g, href));
            $clickedLink = $this;

            $focusElement.prop('tabindex', -1);
            $modalOverlay.removeClass('is-hidden').addClass('is-visible').attr('aria-hidden', 'false');
            $modal.addClass('is-visible').attr('aria-hidden', 'false');
            $modal.find('.modal-tmp').empty().append($modalContent);
            $body.css('marginTop', '-' + scrollTop + 'px').addClass('is-fixed');

            deferred.resolve().then(function () {
                $modal.addClass('is-animation');
            });
        };
        var modalClose = function () {
            var bodyTop = Math.abs(parseInt($body.css('marginTop'), 10));

            $focusElement.removeAttr('tabindex');
            $modalOverlay.removeClass('is-visible').attr('aria-hidden', 'true');
            $modal.removeClass('is-animation').attr('aria-hidden', 'true');
            $body.removeClass('is-fixed').css('marginTop', '');
            $win.scrollTop(bodyTop);
            $clickedLink.focus();

            $modal.one('transitionend', function () {
                $modal.removeClass('is-visible');
                $modalOverlay.addClass('is-hidden');
                $modal.find('.modal-tmp').empty();
            });
        };

        $.fn.setOutboundModal = function () {
            var $a = this;

            if (!$a.length) {
                return $a;
            }

            $a.each(function () {
                var $this = $(this);
                var href = $this.attr('href');

                if (isException(href) || !isWhite(href)) {
                    init();

                    $this.addClass('outBoundModalLink');
                    $this.on('click', {
                        $this: $this,
                        href: href
                    }, modalShow);
                }
            });

            if ($modal !== null && !$._data($modal.get(0), 'events')) {
                $modal.on('click', function (e) {
                    var $target = $(e.target);

                    if (($target.hasClass('box-modal-outbound')) ||
                        ($target.closest('.btn-modal-close, .btn-03').length)) {
                        modalClose();
                    }
                });
            }

            return $a;
        };
    }(jQuery)); // eslint-disable-line

    /* ========================================
    * a要素に外部サイト遷移時モーダル機能を追加
    * ======================================== */
    (function () {
        var $a = $('a').not('a[href^="mailto:"], a[href^="tel:"], .outBoundModalLink');

        if ($a.length) {
            $a.setOutboundModal();
        }
    }());
});