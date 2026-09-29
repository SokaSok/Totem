// animazioni
var sinistra_destra = {
    entra: {
        opacity: [0, 1],
        left: ['-100%', '0%']
    },
    esci: {
        opacity: [0, 1],
        left: ['0%', '100%']
    }
};

var alto_basso = {
    entra: {
        opacity: [0, 1],
        top: ['-100%', '0%']
    },
    esci: {
        opacity: [0, 1],
        top: ['100%', '0%']
    }
};

var colora = {
    entra: {
        opacity: [0, 1],
        filter: ['hue-rotate(360deg)', 'hue-rotate(0deg)']
    }
}


class Anima {

    static img(element, delay, reverse) {
        const img = element.querySelector('.immagine');
        if (img) {
            img.getAnimations().forEach(a => a.cancel());
            img.animate({
                transform: ['scaleX(0)', 'scaleX(1.2)', 'scaleX(1)'],
                opacity: [0, 1]
            }, {
                delay,
                duration: 300,
                fill: 'forwards',
                easing: 'ease-in',
                direction: reverse ? 'reverse' : 'normal'
            })
        }
    }

    static qr(element, reverse) {
        const img = element.querySelector('.qr');
        if (img) {
            img.style.width = 'rotate3d(1, 1, 0, 90deg)';
            img.getAnimations().forEach(a => a.cancel());
            img.animate({
                transform: ['rotate3d(1, 1, 0, 90deg)', 'rotate3d(1, 1, 0, 0deg)']
            }, {
                duration: 300,
                fill: 'forwards',
                easing: 'ease-in-out',
                delay: 800,
                direction: reverse ? 'reverse' : 'normal'
            })
        }
    }

    static testo(element, reverse) {
        const dida = element.querySelector('.testo');
        if (dida) {
            dida.getAnimations().forEach(a => a.cancel());
            dida.animate({
                bottom: ['-100%', '10px'],
                opacity: [0, 1]
            }, {
                duration: 300,
                fill: 'forwards',
                easing: 'ease-in-out',
                delay: 300,
                direction: reverse ? 'reverse' : 'normal'
            })
        }
    }

    static anteprimaScorrimento(bar, inizio, durata) {
        const tempo = differenzaDate(new Date(), inizio);
        const perc = (tempo / durata) * 100;
        //bar.querySelector(':scope > span').style.width = `calc(${perc}% - var(--gr-gap) * 2)`;
        bar.querySelector(':scope > span').style.width = `calc(${perc}% - var(--gr-gap))`;
    }
}
