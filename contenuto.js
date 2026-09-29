/**
 * @typedef {Object} ContenutoParam
 * @property {string?} animazione - Nome dell'animazione
 * @property {{
 *    tempi? : {
 *      inizio : Date | string,
 *      fine : Date | string,
 *    }[],
 *    durata? : number
 * }} comparsa - Dettagli sul periodo e sulla durata (in millesimi) della comparsa dell'elemento a schermo
 * @property {string} contenitore - Nome del contenitore in cui inserire l'elemento
 * @property {string?} durata_slides - Durata in millesimi delle singole slides (in caso in contenuto possa contenerne più di uno. P.e. le pagine di una tabella con molte righe)
 * @property {string[]?} headers - Solo per le tabelle: gli headers delle colonne.
 * @property {string} id - ID univoco dell'elemento
 * @property {string?} iframe - Eventuale iframe da integrare nell'elemento
 * @property {string?} img - Eventuale link del sorgente dell'immagine da integrare nell'elemento
 * @property {string?} link - Eventuale link da integrare nell'elemento
 * @property {Object} properties - Eventuali proprietà aggiuntive per personalizzare il design dell'elemento. Sono necessarie per definire le proprietà delle colonne e delle celle di una tabella nella forma di Record<string: string[] | number[]>, ovvero proprietà a cui corrisponde una lista di valori che corrispondono al numero di colonne della tabella. le proprietà corrispondono a varibili css (--width, --font-weight, ...).
 * @property {string | Array<Object>} testo - Testo o Array di oggetti per contenuti compositi
 * @property {"notizia" | "banner" | "tabella"} tipo - Tipo dell'elemento. 
 * @property {string} titolo - Titolo da visualizzare in testa all'elemento.
 * @property {string[][]} trs - Array bidimensionale conentenente le eventuali righe (e le loro celle) della tabella.
*/
const intervallo_slides = 10000;
const intervallo_sezioni = 60 * 1000;
const intervallo_aggiornamento_tabelle = 1000;
const h_h2_c = 55;
const h_h2_l = 37;

const barTm = document.getElementById('bar').content.firstElementChild;

/**
 * Classe che gestisce i cotnenuti da smistare nei vari contenitore.
*/
class Contenuto {
    /**
     * Sulla base delle proprietò dell'oggetto passato in parametro
     * crea un elemento di tipologia diversa:
     *  - Tabella
     *  - Notizia
     *  - Banner
     * @param {ContenutoParam} par1
    */
    constructor(obj) {
        this.imposta_attributi(obj);
        return this;
    }

    imposta_attributi({
        animazione,
        comparsa,
        contenitore,
        durata_slides,
        headers,
        id,
        iframe,
        img,
        link,
        testo,
        tipo,
        titolo,
        trs,
        properties
    }) {
        this.animazione = window[animazione] || alto_basso;
        this.comparsa = {
            durata: comparsa?.durata || intervallo_sezioni,
            tempi: comparsa?.tempi?.map(t => t ? { inizio: new Date(t.inizio), fine: new Date(t.fine) } : t)
        };

        this.contenitore = document.querySelector(`.${contenitore}`);
        this.durata_slides = durata_slides;
        this.id = id;
        this.iframe = iframe;
        this.link = link;
        this.tipo = tipo;
        this.titolo = titolo;

        this.img = img;
        this.testo = testo;
        this.properties = properties;

        if (trs) {
            this.crea_rows(trs);
            this.headers = headers;
        }
    }

    /**
     * Crea o aggiorna le righe di un elemento di titpo tabella.  
    */
    crea_rows(trs) {
        this.rows = trs.map(n => {
            let vecchio = this.rows?.filter(v => v.tr.join() == n.join())[0];
            return {
                tr: n,
                update: vecchio?.update || new Date()
            }
        });
    }

    /**
     * Crea l'elemento HTML.
     * Ogni elemento ha una progress bar che indica il tempo di visualizzazione rimanente.
     * Se l'elemento è una tabella chiama la funzione per creare una tabella,
     *  altrimenti chiama la funzione per creare una News (valida sia per i banner che per le notizie).
    */
    crea_elemento() {
        const is_table = this.tipo == 'tabella';
        let sezione = is_table ? this.crea_elemento_tabella() : this.crea_elemento_news();
        sezione.classList.add('sezione');

        let bar = sezione.appendChild(this.addProgressBar())
        this.bar = bar;
        this.bar.style.height = (this.contenitore.classList.contains('centrale') ? 38 : 32) + 'px';
        return sezione;
    }

    addProgressBar() {
        return barTm.cloneNode(true);
    }

    /**
     * Crea l'elemento HTML specifico per i Banner e per le Notizie.
     * Inserisce tutte le sezioni necessarie per inserire i vari contenuti opzionali:
     *  - testo
     *  - immagine
     *  - link
     *  - iframe
    */
    crea_elemento_news() {
        const is_banner = this.tipo === 'banner';
        const classeImg = is_banner ? 'immagineBanner' : 'immagineNotizia';
        const classe = is_banner ? 'banner' : 'news';

        let sezione = document.getElementById(this.id);
        if (!sezione) {
            let figli = [creaElemento('div', { classes: 'contenutiBody' })];
            if (is_banner) figli.push(creaElemento('div', { classes: 'contenitoreLink' }));
            sezione = creaElemento('section', {
                figli,
                classes: classe,
                attributes: { id: this.id }
            });
            this.contenitore.appendChild(sezione);
        }
        const body = sezione.querySelector('.contenutiBody');

        let h2 = sezione.querySelector('h2');
        if (!h2) {
            sezione.prepend(creaElemento('h2'));
            h2 = sezione.querySelector('h2');
        }
        h2.innerHTML = this.titolo;

        let testo = body.querySelector('.testo');
        console.log(testo)
        if (this.testo) {
            if (!testo) testo = body.appendChild(creaElemento('div', { classes: 'testo' }));
            if (typeof this.testo == 'string') testo.innerHTML = this.testo;
            else if (typeof this.testo == 'object') {
                testo.innerHTML = this.testo.html || '';
                if (!testo.classList.contains('document_container'))
                    testo.classList.add('document_container')
            }
        } else if (testo && !this.testo) testo.remove();

        console.log(testo, is_banner)

        let img = sezione.querySelector('.immagine');
        if (this.img) {
            if (!img) img = body.appendChild(creaElemento('div', { classes: `immagine ${classeImg}` }));
            img.style.backgroundImage = `url(${this.img})`;
        } else if (img) img.remove();

        let qr = sezione.querySelector('.qr');
        let link = sezione.querySelector('.link');
        let link_cont = sezione.querySelector('.contenitoreLink');
        if (this.link) {
            if (!testo && is_banner) testo = body.appendChild(creaElemento('div', { classes: 'testo' }));

            if (!link_cont) link_cont = (!is_banner ? testo : sezione).appendChild(
                creaElemento('div', { classes: 'contenitoreLink' }));
            if (!qr) qr = link_cont.appendChild(creaElemento('div', { classes: 'qr' }));
            qr.style.backgroundImage = `url(${get_QR(this.link)})`;
            if (!link) link = link_cont.appendChild(creaElemento('div', { classes: 'link' }));
            let a = link.appendChild(creaElemento('a'));
            a.setAttribute('href', this.link);
            a.innerText = this.link.replace(/http:\/\/|https:\/\//, '');

            if (a.offsetWidth > link.offsetWidth) {
                a.style.setProperty('--left_end', `-${a.offsetWidth - link.offsetWidth + 5}px`);
                a.style.setProperty('--left_start', `5px`);
                if (this.comparsa.durata < 5000) a.style.setProperty('--duration', `${this.comparsa.durata}ms`);
            }
        } else {
            if (!qr && !link && link_cont) link_cont.remove();
            else {
                if (qr) qr.remove();
                if (link) link.remove();
            }
        }

        if (testo && !testo.innerHTML && !testo.innerText) testo.remove()

        let iframe = body.querySelector('.iframe');
        if (this.iframe) {
            if (!iframe) iframe = body.appendChild(creaElemento('iframe', { classes: 'iframe' }));
            iframe.setAttribute('src', this.iframe);
            iframe.setAttribute('frameborder', "0");
            iframe.setAttribute('allowfullscreen', "false");
            iframe.setAttribute('mozallowfullscreen', "false");
            iframe.setAttribute('webkitallowfullscreen', "false");

            //iframe.onload = () => iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
        } else if (iframe) iframe.remove();

        return sezione;
    }

    /**
     * Imposta il contenuto di una singola riga di una tabella (solo per il body).
    */
    set_tr(row) {
        const tds = [];
        for (let c = 0; c < row.length; c++) {
            let properties = {};
            Object.keys(this.properties || {})
                .forEach(k => {
                    if (Array.isArray(this.properties[k])) {
                        if (this.properties[k][c] !== undefined) properties[k] = this.properties[k][c];
                    } else properties[k] = this.properties[k];
                });
            //tds.push(creaElemento('td',{figli:[creaElemento('span',{innerHTML:row[c]})]}))
            tds.push(creaElemento('td', {
                innerHTML: `<span>${row[c]}</span>`,
                properties
            }))
        }

        return creaElemento('tr', { figli: tds });
    }

    /**
     * Imposta il THEAD di una tabella.
    */
    set_theader(thead) {
        if (!thead) thead = this.tabella.querySelector('thead');
        let tr = thead.querySelector('tr');
        tr.innerHTML = this.headers
            .map((th, i) => `<th 
                ${this.properties ?
                    `style="${Object.keys(this.properties).map(k => {
                        if (Array.isArray(this.properties[k])) {
                            if (this.properties[k][i] === undefined) return '';
                            return `${k}:${this.properties[k][i]};`
                        }
                        return `${k}:${this.properties[k]};`
                    }).join('')}"` :
                    ''}><span>${th}</span></th>`).join('');
    }

    /**
     * Crea l'elemento HTML tabella associato al Contenuto.
    */
    crea_elemento_tabella() {
        let sezione = creaElemento('section', {
            figli: [creaElemento('h2', { innerHTML: this.titolo })],
            attributes: { id: this.id }
        })
        this.contenitore.appendChild(sezione);

        const thead = creaElemento('thead', { figli: [creaElemento('tr')] });
        thead.appendChild(this.addProgressBar());
        console.log(thead);
        this.set_theader(thead);

        this.tabella = creaElemento('table', {
            figli: [
                thead,
                creaElemento('tbody')
            ]
        }
        );

        sezione.appendChild(this.tabella);
        this.index = 0;

        return sezione;
    }

    /* OBSOLETO */
    crea_elemento_tabella_vecchio() {
        let sezione = document.getElementById(this.id);
        if (!sezione) {
            sezione = creaElemento('section', {
                figli: [creaElemento('h2', { innerHTML: this.titolo })],
                attributes: { id: this.id }
            })
            this.contenitore.appendChild(sezione);
        } else {
            sezione.querySelector(`h2`).innerHTML = this.titolo;
            sezione.querySelector('table')?.remove();
        }

        this.headers = this.tabella.splice(0, 1)[0];
        let rows = this.tabella;
        let ths = [];
        let hiddens = [];

        this.headers.forEach(th => {
            if (th.indexOf('[hidden]') == -1)
                ths.push(creaElemento('th', {
                    figli: [
                        creaElemento('span', { innerText: th })
                    ]
                }));
            else hiddens.push(rows[0].indexOf(th));
        });

        ths.push(this.addProgressBar());

        const thead = creaElemento('thead', { figli: [creaElemento('tr', { figli: ths })] });

        let trs = [];

        for (let i = 0; i < rows.length; i++) {
            const tds = [];
            for (let c = 0; c < rows[i].length; c++) {
                if (hiddens.indexOf(c) == -1)
                    tds.push(creaElemento('td', { figli: [creaElemento('span', { innerHTML: rows[i][c] })] }))
            }

            let attributes = {};
            if (hiddens.length) hiddens.forEach(el => {
                attributes['data-' + rows[0][el].replace('[hidden]', '')] = rows[i][el] !== null ? rows[i][el] : ''
            });

            const tr = creaElemento('tr', { figli: tds, attributes });
            trs.push({
                tr,
                update: new Date()
            });
        }

        const tbody = creaElemento('tbody');

        this.tabella = sezione.querySelector('table') || creaElemento('table', {
            figli: [
                thead,
                tbody
            ]
        }
        );



        sezione.appendChild(this.tabella);
        this.rows = trs;

        if (this.index === undefined) this.index = 0;

        return sezione;
    }

    /**
     * Innesca le animazioni:
     *  - anima lo scorrimento delle pagine della tabella (se è una tabella)
     *  - anima lo scorrimento delle news (banner e notizie)
    */
    aggiorna() {
        const is_table = this.tipo == 'tabella';
        Anima.anteprimaScorrimento(this.bar, this.inizio, this.comparsa.durata);

        if (is_table) return this.aggiorna_tabella();
        return this.aggiorna_news();
    }

    /**
     * Aggiorna lo scorrimento delle slides della tabella
     */
    aggiorna_tabella() {
        this.set_theader();
        Anima.anteprimaScorrimento(this.tabella.querySelector('thead .progress'), this.inizio_slide, this.durata_slides);
        const now = new Date();
        if (!this.maxTr) this.maxTr = this.calcolaMaxTr();
        if (this.maxTr < 0) return;

        const maxTr = this.maxTr;
        const slides = Math.ceil(this.rows.length / maxTr);
        if (!this.durata_slides) {
            this.durata_slides = Math.max(Math.ceil(this.comparsa.durata / slides), intervallo_slides);
        }
        if (this.comparsa.durata < this.durata_slides * slides) {
            this.comparsa.durata = this.durata_slides * slides;
        }

        if (this.inizio_slide && differenzaDate(now, this.inizio_slide) < this.durata_slides)
            return;

        this.inizio_slide = now;

        if (this.index < (this.rows / maxTr)) this.index = 0;

        const rows = (this.index + maxTr) < this.rows.length ?
            maxTr :
            (this.rows.length - this.index);

        const tbody = this.tabella.querySelector('tbody');
        tbody.innerHTML = '';
        for (let i = this.index, j = 0; i < this.index + rows; i++, j++) {
            let tr = this.set_tr(this.rows[i].tr);
            [...tr.querySelectorAll('td')].forEach(td => {
                td.style.setProperty('--delay', j % maxTr)
            });
            tbody.appendChild(tr);

            const aggiornamento = this.rows[i].update;
            if (aggiornamento && new Date(new Date(aggiornamento).getTime() + limite_aggiornamento) >= new Date()) { tr.classList.add('nuovo'); }
            else if (tr.classList.contains('nuovo')) tr.classList.remove('nuovo');
        }

        this.index += (maxTr - 1);
        if (this.index >= this.rows.length) this.index = 0;
    }

    /**
     * Funzione di design: calcola l'altezza massima delle TR a vista della tabella, per poterle distribuire omogeneamente
    */
    calcolaMaxTr() {
        if (!this.rows.length) return -1;

        const tbody = this.tabella.querySelector('tbody');
        let tot = 0;
        let tot_height = 0;
        if (this.index === undefined) {
            this.index = 0;

            const h2h = this.contenitore.classList.contains('centrale') ? h_h2_c : h_h2_l;
            const padd = 35;
            const thead = this.tabella.querySelector('thead').offsetHeight;
            tbody.style.height = (this.sezione.offsetHeight - thead - h2h - padd) + 'px';
        }
        let ind = tot + this.index;
        const par_height = tbody.offsetHeight;
        while (tot_height < tbody.offsetHeight) {
            if (ind >= this.rows.length) ind = 0;
            const tr = tbody.appendChild(this.set_tr(this.rows[ind++].tr));
            tot_height += tr.offsetHeight;
            tr.remove();
            if (tot_height > par_height) {
                return tot;
            }
            tot++;
        }
        return tot;
    }



    aggiorna_news() {

    }


    /**
     * Chiama le animazioni dell'elemento (in entrata o in uscita in base 
     * al parametro 'nascondi')
    */
    anima(nascondi) {
        const options = {
            duration: 300,
            easing: 'ease-in-out',
            fill: 'forwards'
        }

        let animazione = this.animazione[nascondi ? 'esci' : 'entra'];
        if (!animazione && nascondi) animazione = this.animazione.entra;

        if (nascondi) options.direction = 'reverse';
        else options.delay = 300;

        if (!nascondi) this.sezione.animate(animazione, options);

        // if (this.tipo == 'notizia') {
        Anima.img(this.sezione, (nascondi ? 0 : 500), nascondi);
        Anima.testo(this.sezione, nascondi);
        Anima.qr(this.sezione, nascondi);
        //  } else if (this.tipo == 'banner') {
        //animaImg(slides[slide_index],500);
        //      Anima.qr(this.sezione,nascondi);                
        //  }

        if (nascondi) this.sezione.animate(animazione, options);
    }

    /**
     * Mostra o nasconde (in base al parametro 'nascondi') 
    */
    mostra(nascondi) {
        let da_nascondere = [];
        let da_mostrare;

        if (!nascondi) {
            [...this.contenitore.querySelectorAll('.sezione')]
                .map(s => Contenuto.contenuti.filter(c => c.sezione == s)[0])
                .forEach(s => {
                    if (s.sezione.classList.contains('show') && s.sezione != this.sezione) {
                        da_nascondere.push(s);
                    } else if (!s.sezione.classList.contains('show') && s.sezione == this.sezione) {
                        da_mostrare = s;
                    }
                });
        } else {
            da_nascondere.push(this);
        }

        da_nascondere.forEach(s => {
            if (!s.sezione) return;
            s.sezione.classList.remove('show');
            s.anima(true);
            console.log(`%cNASCONDO %c${s.id}`,
                'background: black; color: yellow;text-size: 14px;',
                'background: black; color: lime;text-size: 14px;')
        });

        if (!da_mostrare) return;

        da_mostrare.sezione.classList.add('show');
        da_mostrare.anima();
        da_mostrare.aggiorna();
        console.log(`%cMOSTRO %c${da_mostrare.id}`,
            'background: gray; color: yellow;text-size: 14px;',
            'background: gray; color: lime;text-size: 14px;')
        //this.aggiorna();
    }

    is_shown() {
        if (!this.inizio) return;
        return (differenzaDate(new Date(), this.inizio) <= this.comparsa.durata);
    }

    static contenuti = [];
    static contenitori = [
        {
            element: document.querySelector('.centrale'),
            index: -1
        }, {
            element: document.querySelector('.laterale'),
            index: -1
        }, {
            element: document.querySelector('.inferiore'),
            index: -1
        }
    ];

    /**
     * 
     * @param {ContenutoParam} obj 
     */
    static aggiungi_contenuto(obj) {
        let contenuto = Contenuto.contenuti.find(c => c.id == obj.id);
        if (contenuto) {
            return contenuto.imposta_attributi(obj);
        }

        Contenuto.contenuti.push(new Contenuto(obj));
    }

    static scorri_contenuti_alternativo_2() {
        Contenuto.contenuti.reduce((a, c) => {
            let contenitore = a.filter(cc => cc.contenitore == c.contenitore)[0];
            if (!contenitore) {
                contenitore = {
                    contenitore: c.contenitore,
                    contenuti: []
                }
                a.push(contenitore);
            }
            contenitore.contenuti.push(c);
            return a;
        }, [])
            .forEach(contenitore => {
                // determino quali contenuti mettere in coda di visualizzazione
                let dt = new Date();
                const fissati = contenitore.contenuti.filter(c =>
                    c.comparsa.tempi?.some(t =>
                        t.inizio && t.fine &&
                        dataCompresa(dt, t.inizio, t.fine)
                    ));
                //const non_fissati = contenitore.contenuti.filter(c => !c.comparsa.tempi?.some(t => t.inizio && t.fine && dataCompresa(dt,t.inizio,t.fine)));
                const non_fissati = contenitore.contenuti.filter(c => !c.comparsa.tempi || !c.comparsa.tempi.length);

                const visualizzandi = fissati.length ? fissati : non_fissati;

                for (let i = 0; i < visualizzandi.length; i++) {
                    const c = visualizzandi[i];
                    if (!c.sezione) c.sezione = c.crea_elemento();
                    //console.log(c.sezione);
                    if (c.is_shown()) {
                        c.aggiorna();
                        //console.log(Math.floor(((c.inizio.getTime() + c.comparsa.durata) - dt.getTime()) / 1000))
                    } else if (!contenitore.contenuti.some(cc => cc.is_shown()) && !c.inizio) {
                        c.inizio = dt;
                        c.index = 0;
                        c.mostra();
                        break;
                    } else if (c.inizio) c.inizio = undefined;
                }
            });

    }

    static scorri_contenuti() {
        Contenuto.contenitori.forEach(contenitore => {
            // determino quali contenuti mettere in coda di visualizzazione
            let dt = new Date();
            contenitore.contenuti = Contenuto.contenuti.filter(c => c.contenitore == contenitore.element);
            const fissati = contenitore.contenuti.filter(c =>
                c.comparsa.tempi?.some(t =>
                    t.inizio && t.fine &&
                    dataCompresa(dt, t.inizio, t.fine)
                ));
            const non_fissati = contenitore.contenuti.filter(c =>
                !c.comparsa.tempi || !c.comparsa.tempi.length);

            const mostra_fissati = fissati.length ? true : false;
            const visualizzandi = mostra_fissati ? fissati : non_fissati;
            if (!visualizzandi.length) {
                // nascondi tutti contenuti
                contenitore.contenuti.forEach(cc => cc.mostra(true));
                contenitore.index = -1;
                return;
            }

            if (contenitore.fissati != mostra_fissati) {
                contenitore.fissati = mostra_fissati;
                contenitore.index = visualizzandi[0].id;
            }

            if (contenitore.index == -1) contenitore.index = visualizzandi[0].id;

            //for (let i = 0; i < visualizzandi.length; i++) {
            const c = Contenuto.contenuti.filter(cc => cc.id == contenitore.index)[0];
            if (!c.sezione) c.sezione = c.crea_elemento();
            //console.log(c.sezione);
            if (c.is_shown()) {
                // contenuto è già mostrato: AGGIORNO contenuto

                c.aggiorna();
                //console.log(Math.floor(((c.inizio.getTime() + c.comparsa.durata) - dt.getTime()) / 1000))
            } else if (!contenitore.contenuti.some(cc => cc.is_shown()) && !c.inizio) {
                // non ci sono contenuti mostrati: MOSTRO contenuto

                c.inizio = dt;
                c.index = 0;
                c.mostra();
                //break;
            } else if (c.inizio) {
                // contenuto scaduto: INCREMENTO indice

                c.inizio = undefined;
                let ind = visualizzandi.findIndex(v => v.id == c.id);
                contenitore.index = visualizzandi[((ind + 1) >= visualizzandi.length) ? 0 : (ind + 1)].id;
            }
            //}
        });

    }

    static scorri_contenuti_alternativo() {
        console.log('scorro', new Date())
        fissati = [];
        non_fissati = [];

        let dt = new Date();

        for (let c = 0; c < contenitori.length; c++) {
            for (let i = 0; i < Contenuto.contenuti.length; i++) {
                if (Contenuto.contenuti[i].contenitore != contenitori[c]) continue;

                //let ind = c*contenitori.length+i;
                let id = Contenuto.contenuti[i].id;

                // determino se fissato
                if (Contenuto.contenuti[i].comparsa.tempi?.some(t =>
                    t.inizio && t.fine && dataCompresa(dt, t.inizio, t.fine))) {
                    fissati.push(id)
                } else if (!Contenuto.contenuti[i].comparsa.tempi?.some(t => t.inizio && t.fine && dataCompresa(dt, t.inizio, t.fine))) {
                    non_fissati.push(id)
                }
            }
        }

        visualizzandi = fissati.length ? fissati : non_fissati;
        //console.log({visualizzandi,fissati,non_fissati});

        for (let i = 0; i < visualizzandi.length; i++) {
            var c = Contenuto.contenuti.filter(co => co.id == visualizzandi[i])[0];
            if (!c.sezione) c.sezione = c.crea_elemento();
            //console.log(c.sezione);
            if (c.is_shown()) c.aggiorna();
            else if (!Contenuto.contenuti.some(cc => cc.contenitore == c.contenitore && cc.is_shown())) {
                c.inizio = dt;
                c.mostra();
                break;
            }
        }

        //Contenuto.avvia_loop();
    }

    static avvia_loop() {
        this.scorri_contenuti();
        setInterval(this.scorri_contenuti, intervallo_aggiornamento_tabelle);
    }

}