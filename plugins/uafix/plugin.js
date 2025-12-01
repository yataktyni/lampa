(() => {
    Lampa.Plugin.create('uafix', {
        title: 'UAFiX',
        icon: '🔵'
    }, function () {

        // коли відкрито сторінку фільму / серіалу
        Lampa.Listener.follow('full', function (event) {
            if (event.type !== 'complite') return;

            const card = event.data;
            const title = card.name || card.original_name;

            // пошук на сайті
            searchUAFIX(title).then(result => {
                if (!result) return;

                // додаємо кнопку в плеєр
                Lampa.PlayerPanel.add({
                    title: `UAFiX — ${result.quality}`,
                    icon: 'play_arrow',
                    onSelect: () => {
                        Lampa.Player.play({
                            title,
                            url: result.stream,
                            timeline: 0
                        });
                    }
                });
            });

        });

        async function searchUAFIX(query) {
            try {
                const url = 'https://uafix.net/search?term=' + encodeURIComponent(query);

                // лампа робить запити через свій проксі, тому fetch має працювати
                const html = await fetch(url).then(r => r.text());

                // простий парсинг без cheerio (щоб без бібліотек)
                const itemUrl = html.match(/href="(\/serial\/[^"]+)"/);
                if (!itemUrl) return null;

                const moviePage = await fetch('https://uafix.net' + itemUrl[1]).then(r => r.text());

                const stream = moviePage.match(/source src="([^"]+)"/);
                if (!stream) return null;

                return {
                    quality: 'HD',
                    stream: stream[1]
                };

            } catch (e) {
                console.log('UAFiX error', e);
                return null;
            }
        }

    });
})();