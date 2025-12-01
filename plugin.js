(function() {
    'use strict';

    var Network = Lampa.Reguest;

    function parseUAFiX(html, query) {
        var results = [];
        try {
            var $html = $('<div>' + html + '</div>');
            $html.find('.movie-item, .film-item, .search-result-item').each(function() {
                var item = $(this);
                var title = item.find('.title, h3, h2').first().text().trim();
                var url = item.find('a').first().attr('href');
                var img = item.find('img').first().attr('src') || item.find('img').first().attr('data-src');
                var year = item.find('.year, .date').first().text().match(/\d{4}/);
                
                if (title && url) {
                    if (url && !url.startsWith('http')) {
                        url = 'https://uafix.net' + (url.startsWith('/') ? url : '/' + url);
                    }
                    if (img && !img.startsWith('http')) {
                        img = 'https://uafix.net' + (img.startsWith('/') ? img : '/' + img);
                    }
                    
                    results.push({
                        title: title,
                        url: url,
                        img: img,
                        year: year ? year[0] : null,
                        release_date: year ? year[0] : '0000'
                    });
                }
            });
        } catch(e) {
            console.error('UAFiX parse error:', e);
        }
        return results;
    }

    function parseUASerials(html, query) {
        var results = [];
        try {
            var $html = $('<div>' + html + '</div>');
            $html.find('.movie-item, .film-item, .search-result-item, .post-item').each(function() {
                var item = $(this);
                var title = item.find('.title, h3, h2, .post-title').first().text().trim();
                var url = item.find('a').first().attr('href');
                var img = item.find('img').first().attr('src') || item.find('img').first().attr('data-src');
                var year = item.find('.year, .date, .meta').first().text().match(/\d{4}/);
                
                if (title && url) {
                    if (url && !url.startsWith('http')) {
                        url = 'https://uaserials.pro' + (url.startsWith('/') ? url : '/' + url);
                    }
                    if (img && !img.startsWith('http')) {
                        img = 'https://uaserials.pro' + (img.startsWith('/') ? img : '/' + img);
                    }
                    
                    results.push({
                        title: title,
                        url: url,
                        img: img,
                        year: year ? year[0] : null,
                        release_date: year ? year[0] : '0000'
                    });
                }
            });
        } catch(e) {
            console.error('UASerials parse error:', e);
        }
        return results;
    }

    function parseUAFiXVideoPage(html) {
        var videos = [];
        try {
            var $html = $('<div>' + html + '</div>');
            
            $html.find('.episode-item, .season-item, .video-item').each(function() {
                var item = $(this);
                var title = item.find('.title, .episode-title').text().trim();
                var url = item.find('a, iframe').first().attr('href') || item.find('a, iframe').first().attr('data-src');
                var season = title.match(/[Сс]езон\s*(\d+)/i) || item.attr('data-season');
                var episode = title.match(/[Сс]ери[яя]\s*(\d+)/i) || item.attr('data-episode');
                
                if (url) {
                    videos.push({
                        title: title || 'Episode',
                        url: url,
                        season: season ? parseInt(season[1] || season) : null,
                        episode: episode ? parseInt(episode[1] || episode) : null
                    });
                }
            });
            
            if (videos.length === 0) {
                var iframe = $html.find('iframe[src*="player"], iframe[src*="video"]').first();
                if (iframe.length) {
                    videos.push({
                        title: 'Play',
                        url: iframe.attr('src'),
                        method: 'play'
                    });
                }
            }
        } catch(e) {
            console.error('UAFiX video parse error:', e);
        }
        return videos;
    }

    function parseUASerialsVideoPage(html) {
        var videos = [];
        try {
            var $html = $('<div>' + html + '</div>');
            
            $html.find('.episode-item, .season-item, .video-item').each(function() {
                var item = $(this);
                var title = item.find('.title, .episode-title').text().trim();
                var url = item.find('a, iframe').first().attr('href') || item.find('a, iframe').first().attr('data-src');
                var season = title.match(/[Сс]езон\s*(\d+)/i) || item.attr('data-season');
                var episode = title.match(/[Сс]ери[яя]\s*(\d+)/i) || item.attr('data-episode');
                
                if (url) {
                    videos.push({
                        title: title || 'Episode',
                        url: url,
                        season: season ? parseInt(season[1] || season) : null,
                        episode: episode ? parseInt(episode[1] || episode) : null
                    });
                }
            });
            
            if (videos.length === 0) {
                var iframe = $html.find('iframe[src*="player"], iframe[src*="video"]').first();
                if (iframe.length) {
                    videos.push({
                        title: 'Play',
                        url: iframe.attr('src'),
                        method: 'play'
                    });
                }
            }
        } catch(e) {
            console.error('UASerials video parse error:', e);
        }
        return videos;
    }

    function component(object) {
        var network = new Network();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true
        });
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        var source = object.source || Lampa.Storage.get('uafix_uaserials_source', 'uafix');
        var baseUrl = source === 'uaserials' ? 'https://uaserials.pro' : 'https://uafix.net';
        var last;
        var videos = [];
        var sources_list = {
            'uafix': { name: 'UAFiX', url: 'https://uafix.net' },
            'uaserials': { name: 'UASerials', url: 'https://uaserials.pro' }
        };

        this.changeSource = function(newSource) {
            source = newSource;
            baseUrl = sources_list[newSource].url;
            Lampa.Storage.set('uafix_uaserials_source', newSource);
            object.source = newSource;
            this.reset();
            this.search();
        };

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            filter.onBack = function() {
                Lampa.Activity.backward();
            };
            filter.onSelect = function(type, a, b) {
                if (type == 'sort') {
                    Lampa.Select.close();
                    _this.changeSource(a.source);
                }
            };
            filter.render().find('.filter--sort span').text('Origin');
            scroll.body().addClass('torrent-list');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            Lampa.Controller.enable('content');
            this.loading(false);
            this.updateSourceFilter();
            this.search();
        };

        this.updateSourceFilter = function() {
            var sourceItems = Object.keys(sources_list).map(function(key) {
                return {
                    title: sources_list[key].name,
                    source: key,
                    selected: key == source
                };
            });
            filter.set('sort', sourceItems);
            filter.chosen('sort', [sources_list[source].name]);
        };

        this.search = function() {
            var searchQuery = object.search || object.movie.title || object.movie.name || '';
            var searchUrl = baseUrl + '/search?term=' + encodeURIComponent(searchQuery);
            
            network.native(searchUrl, function(html) {
                var results = source === 'uaserials' ? parseUASerials(html, searchQuery) : parseUAFiX(html, searchQuery);
                
                if (results.length === 0) {
                    this.empty();
                } else if (results.length === 1 && !object.clarification) {
                    this.loadVideoPage(results[0].url);
                } else {
                    this.displayResults(results);
                }
            }.bind(this), function() {
                this.empty();
            }.bind(this), false, {
                dataType: 'text'
            });
        };

        this.loadVideoPage = function(url) {
            network.native(url, function(html) {
                videos = source === 'uaserials' ? parseUASerialsVideoPage(html) : parseUAFiXVideoPage(html);
                
                if (videos.length > 0) {
                    this.display(videos);
                } else {
                    this.empty();
                }
            }.bind(this), function() {
                this.empty();
            }.bind(this), false, {
                dataType: 'text'
            });
        };

        this.displayResults = function(results) {
            scroll.clear();
            
            results.forEach(function(item) {
                var info = [];
                if (item.year) info.push(item.year);
                if (item.details) info.push(item.details);
                
                var html = Lampa.Template.get('lampac_prestige_folder', {
                    title: item.title,
                    time: '',
                    info: info.join('<span class="online-prestige-split">●</span>')
                });
                
                if (item.img) {
                    var image = $('<img style="height: 7em; width: 7em; border-radius: 0.3em;"/>');
                    html.find('.online-prestige__folder').empty().append(image);
                    
                    var imgUrl = item.img;
                    if (imgUrl && !imgUrl.startsWith('http')) {
                        imgUrl = baseUrl + (imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl);
                    }
                    
                    Lampa.Utils.imgLoad(image, imgUrl);
                }
                
                html.on('hover:enter', function() {
                    this.reset();
                    this.loadVideoPage(item.url);
                }.bind(this)).on('hover:focus', function(e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });
                
                scroll.append(html);
            }.bind(this));
            
            this.loading(false);
            Lampa.Controller.enable('content');
        };

        this.display = function(videosList) {
            scroll.clear();
            
            videosList.forEach(function(video, index) {
                var html = Lampa.Template.get('lampac_prestige_full', {
                    title: video.title || ('Episode ' + (video.episode || index + 1)),
                    time: '',
                    info: video.season ? 'Season ' + video.season + ', Episode ' + video.episode : '',
                    quality: ''
                });
                
                html.on('hover:enter', function() {
                    this.playVideo(video);
                }.bind(this)).on('hover:focus', function(e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });
                
                scroll.append(html);
            }.bind(this));
            
            Lampa.Controller.enable('content');
        };

        this.playVideo = function(video) {
            if (video.method === 'play' || video.url) {
                var play = {
                    title: video.title,
                    url: video.url,
                    season: video.season,
                    episode: video.episode
                };
                
                Lampa.Player.play(play);
            }
        };

        this.create = function() {
            return this.render();
        };

        this.render = function() {
            return files.render();
        };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;
            if (!this.initialized) {
                this.initialized = true;
                this.initialize();
            }
            Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: function() {
                    if (Navigator.canmove('up')) {
                        Navigator.move('up');
                    } else {
                        Lampa.Controller.toggle('head');
                    }
                },
                down: function() {
                    Navigator.move('down');
                },
                right: function() {
                    if (Navigator.canmove('right')) Navigator.move('right');
                    else filter.show('Filter', 'filter');
                },
                left: function() {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        };

        this.back = function() {
            Lampa.Activity.backward();
        };

        this.loading = function(status) {
            if (status) {
                this.activity.loader(true);
            } else {
                this.activity.loader(false);
                this.activity.toggle();
            }
        };

        this.empty = function() {
            scroll.clear();
            var html = Lampa.Template.get('lampac_does_not_answer', {});
            html.find('.online-empty__title').text('Nothing found');
            html.find('.online-empty__time').text('No results found for your search');
            html.find('.online-empty__buttons').remove();
            scroll.append(html);
            this.loading(false);
        };

        this.destroy = function() {
            network.clear();
            files.destroy();
            scroll.destroy();
        };

        this.reset = function() {
            scroll.clear();
            network.clear();
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
        };

        this.pause = function() {};
        this.stop = function() {};
    }

    function addUAFiXSearchSource() {
        var network = new Network();
        
        var source = {
            title: 'UAFiX',
            search: function(params, onComplete) {
                var query = params.query;
                var searchUrl = 'https://uafix.net/search?term=' + encodeURIComponent(query);
                
                network.native(searchUrl, function(html) {
                    var results = parseUAFiX(html, query);
                    
                    if (results.length > 0) {
                        var cards = results.map(function(item) {
                            return {
                                title: item.title,
                                url: item.url,
                                img: item.img,
                                release_date: item.release_date || '0000',
                                year: item.year
                            };
                        });
                        
                        onComplete([{
                            title: 'UAFiX',
                            results: cards
                        }]);
                    } else {
                        onComplete([]);
                    }
                }, function() {
                    onComplete([]);
                }, false, {
                    dataType: 'text'
                });
            },
            onCancel: function() {
                network.clear();
            },
            params: {
                lazy: true,
                align_left: true,
                card_events: {
                    onMenu: function() {}
                }
            },
            onMore: function(params, close) {
                close();
            },
            onSelect: function(params, close) {
                close();
                
                Lampa.Activity.push({
                    url: params.element.url,
                    title: 'UAFiX - ' + params.element.title,
                    component: 'uafix-uaserials',
                    movie: params.element,
                    source: 'uafix',
                    search: params.element.title
                });
            }
        };
        
        Lampa.Search.addSource(source);
    }

    function addUASerialsSearchSource() {
        var network = new Network();
        
        var source = {
            title: 'UASerials',
            search: function(params, onComplete) {
                var query = params.query;
                var searchUrl = 'https://uaserials.pro/search?term=' + encodeURIComponent(query);
                
                network.native(searchUrl, function(html) {
                    var results = parseUASerials(html, query);
                    
                    if (results.length > 0) {
                        var cards = results.map(function(item) {
                            return {
                                title: item.title,
                                url: item.url,
                                img: item.img,
                                release_date: item.release_date || '0000',
                                year: item.year
                            };
                        });
                        
                        onComplete([{
                            title: 'UASerials',
                            results: cards
                        }]);
                    } else {
                        onComplete([]);
                    }
                }, function() {
                    onComplete([]);
                }, false, {
                    dataType: 'text'
                });
            },
            onCancel: function() {
                network.clear();
            },
            params: {
                lazy: true,
                align_left: true,
                card_events: {
                    onMenu: function() {}
                }
            },
            onMore: function(params, close) {
                close();
            },
            onSelect: function(params, close) {
                close();
                
                Lampa.Activity.push({
                    url: params.element.url,
                    title: 'UASerials - ' + params.element.title,
                    component: 'uafix-uaserials',
                    movie: params.element,
                    source: 'uaserials',
                    search: params.element.title
                });
            }
        };
        
        Lampa.Search.addSource(source);
    }

    function startPlugin() {
        var manifest = {
            type: 'video',
            version: '1.0.0',
            name: 'UAFiX & UASerials Direct',
            description: 'Direct parsing plugin for UAFiX.net and UASerials.pro',
            component: 'uafix-uaserials',
            onContextMenu: function(object) {
                return {
                    name: 'Watch on UAFiX/UASerials',
                    description: ''
                };
            },
            onContextLauch: function(object) {
                resetTemplates();
                Lampa.Component.add('uafix-uaserials', component);
                
                var id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title);
                var all = Lampa.Storage.get('clarification_search', '{}');
                var savedSource = Lampa.Storage.get('uafix_uaserials_source', 'uafix');
                
                var movieObj = Lampa.Arrays.clone(object);
                movieObj.source = savedSource;
                
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('title_online'),
                    component: 'uafix-uaserials',
                    search: all[id] ? all[id] : (object.title || object.name),
                    search_one: object.title || object.name,
                    search_two: object.original_title || object.original_name,
                    movie: movieObj,
                    page: 1,
                    clarification: all[id] ? true : false,
                    source: savedSource
                });
            }
        };
        
        Lampa.Manifest.plugins = manifest;
        
        Lampa.Lang.add({
            uafix_uaserials_watch: {
                ru: 'Смотреть на UAFiX/UASerials',
                en: 'Watch on UAFiX/UASerials',
                uk: 'Дивитися на UAFiX/UASerials'
            },
            title_online: {
                ru: 'Онлайн',
                uk: 'Онлайн',
                en: 'Online',
                zh: '在线的'
            }
        });
        
        function resetTemplates() {
            if (!Lampa.Template.get('lampac_prestige_folder')) {
                Lampa.Template.add('lampac_prestige_folder', "<div class=\"online-prestige online-prestige--folder selector\">\n            <div class=\"online-prestige__folder\">\n                <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n                </svg>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                </div>\n            </div>\n        </div>");
            }
            if (!Lampa.Template.get('lampac_prestige_full')) {
                Lampa.Template.add('lampac_prestige_full', "<div class=\"online-prestige online-prestige--full selector\">\n            <div class=\"online-prestige__img\">\n                <img alt=\"\">\n                <div class=\"online-prestige__loader\"></div>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n                <div class=\"online-prestige__timeline\"></div>\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                    <div class=\"online-prestige__quality\">{quality}</div>\n                </div>\n            </div>\n        </div>");
            }
            if (!Lampa.Template.get('lampac_content_loading')) {
                Lampa.Template.add('lampac_content_loading', "<div class=\"online-empty\">\n            <div class=\"broadcast__scan\"><div></div></div>\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template selector\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
            }
            if (!Lampa.Template.get('lampac_does_not_answer')) {
                Lampa.Template.add('lampac_does_not_answer', "<div class=\"online-empty\">\n            <div class=\"online-empty__title\">Nothing found</div>\n            <div class=\"online-empty__time\">No results found</div>\n            <div class=\"online-empty__buttons\"></div>\n        </div>");
            }
        }
        
        resetTemplates();
        
        if (!document.getElementById('uafix-uaserials-css')) {
            var css = document.createElement('style');
            css.id = 'uafix-uaserials-css';
            css.textContent = "@charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}";
            document.head.appendChild(css);
        }
        
        Lampa.Component.add('uafix-uaserials', component);
        
        addUAFiXSearchSource();
        addUASerialsSearchSource();
        
        var button = "<div class=\"full-start__button selector view--online uafix-uaserials--button\" data-subtitle=\"" + manifest.name + " v" + manifest.version + "\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 392.697 392.697\" xml:space=\"preserve\">\n            <path d=\"M21.837,83.419l36.496,16.678L227.72,19.886c1.229-0.592,2.002-1.846,1.98-3.209c-0.021-1.365-0.834-2.592-2.082-3.145\n                L197.766,0.3c-0.903-0.4-1.933-0.4-2.837,0L21.873,77.036c-1.259,0.559-2.073,1.803-2.081,3.18\n                C19.784,81.593,20.584,82.847,21.837,83.419z\" fill=\"currentColor\"></path>\n            <path d=\"M185.689,177.261l-64.988-30.01v91.617c0,0.856-0.44,1.655-1.167,2.114c-0.406,0.257-0.869,0.386-1.333,0.386\n                c-0.368,0-0.736-0.082-1.079-0.244l-68.874-32.625c-0.869-0.416-1.421-1.293-1.421-2.256v-92.229L6.804,95.5\n                c-1.083-0.496-2.344-0.406-3.347,0.238c-1.002,0.645-1.608,1.754-1.608,2.944v208.744c0,1.371,0.799,2.615,2.045,3.185\n                l178.886,81.768c0.464,0.211,0.96,0.315,1.455,0.315c0.661,0,1.318-0.188,1.892-0.555c1.002-0.645,1.608-1.754,1.608-2.945\n                V180.445C187.735,179.076,186.936,177.831,185.689,177.261z\" fill=\"currentColor\"></path>\n            <path d=\"M389.24,95.74c-1.002-0.644-2.264-0.732-3.347-0.238l-178.876,81.76c-1.246,0.57-2.045,1.814-2.045,3.185v208.751\n                c0,1.191,0.606,2.302,1.608,2.945c0.572,0.367,1.23,0.555,1.892,0.555c0.495,0,0.991-0.104,1.455-0.315l178.876-81.768\n                c1.246-0.568,2.045-1.813,2.045-3.185V98.685C390.849,97.494,390.242,96.384,389.24,95.74z\" fill=\"currentColor\"></path>\n            <path d=\"M372.915,80.216c-0.009-1.377-0.823-2.621-2.082-3.18l-60.182-26.681c-0.938-0.418-2.013-0.399-2.938,0.045\n                l-173.755,82.992l60.933,29.117c0.462,0.211,0.958,0.316,1.455,0.316s0.993-0.105,1.455-0.316l173.066-79.092\n                C372.122,82.847,372.923,81.593,372.915,80.216z\" fill=\"currentColor\"></path>\n        </svg>\n        <span>#{title_online}</span>\n    </div>";
        
        function addButton(e) {
            if (e.render.find('.uafix-uaserials--button').length) return;
            
            var btn = $(Lampa.Lang.translate(button));
            
            btn.on('hover:enter', function() {
                resetTemplates();
                Lampa.Component.add('uafix-uaserials', component);
                
                var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
                var all = Lampa.Storage.get('clarification_search', '{}');
                var savedSource = Lampa.Storage.get('uafix_uaserials_source', 'uafix');
                
                var movieObj = Lampa.Arrays.clone(e.movie);
                movieObj.source = savedSource;
                
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('title_online'),
                    component: 'uafix-uaserials',
                    search: all[id] ? all[id] : (e.movie.title || e.movie.name),
                    search_one: e.movie.title || e.movie.name,
                    search_two: e.movie.original_title || e.movie.original_name,
                    movie: movieObj,
                    page: 1,
                    clarification: all[id] ? true : false,
                    source: savedSource
                });
            });
            
            e.render.after(btn);
        }
        
        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                addButton({
                    render: e.object.activity.render().find('.view--torrent'),
                    movie: e.data.movie
                });
            }
        });
        
        try {
            if (Lampa.Activity.active().component == 'full') {
                addButton({
                    render: Lampa.Activity.active().activity.render().find('.view--torrent'),
                    movie: Lampa.Activity.active().card
                });
            }
        } catch (e) {}
    }

    if (!window.uafix_uaserials_plugin) {
        window.uafix_uaserials_plugin = true;
        startPlugin();
    }

})();

