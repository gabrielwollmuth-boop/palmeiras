'use strict';

/* ==========================================================================
   Portfólio S.E. Palmeiras — script.js
   Organizado em módulos independentes, cada um cuidando de uma
   responsabilidade só. Tudo roda depois que o DOM está pronto.
   ========================================================================== */

// Marca que o JavaScript carregou e está rodando. O CSS só esconde
// elementos ".reveal" quando esta classe existe em <html> — assim,
// se este arquivo não for encontrado (nome/caminho errado, etc.),
// o texto da página nunca fica escondido para sempre.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initMenuMobile();
    initHeaderScroll();
    initRolagemSuave();
    initLinkAtivo();
    initRevelacaoAoRolar(prefersReducedMotion);
    initContadores(prefersReducedMotion);
    initVoltarAoTopo();
    initAnoRodape();
    initConfeteTrofeus(prefersReducedMotion);
});

/* --------------------------------------------------------------------------
   1) Menu mobile (hambúrguer)
   -------------------------------------------------------------------------- */
function initMenuMobile() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    const fecharMenu = () => {
        toggle.classList.remove('open');
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menu');
    };

    const alternarMenu = () => {
        const aberto = menu.classList.toggle('open');
        toggle.classList.toggle('open', aberto);
        toggle.setAttribute('aria-expanded', String(aberto));
        toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    };

    toggle.addEventListener('click', alternarMenu);

    // Fecha o menu ao clicar em qualquer link (útil no celular)
    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', fecharMenu);
    });

    // Fecha o menu se a tela for redimensionada para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) fecharMenu();
    });
}

/* --------------------------------------------------------------------------
   2) Cabeçalho "encolhe" e ganha sombra ao rolar a página
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    const LIMIAR = 40;
    let ultimoEstado = false;

    const atualizar = () => {
        const rolado = window.scrollY > LIMIAR;
        if (rolado !== ultimoEstado) {
            header.classList.toggle('scrolled', rolado);
            ultimoEstado = rolado;
        }
    };

    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
}

/* --------------------------------------------------------------------------
   3) Rolagem suave até as seções, compensando a altura do cabeçalho fixo
   -------------------------------------------------------------------------- */
function initRolagemSuave() {
    const header = document.querySelector('header');
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach((link) => {
        link.addEventListener('click', (evento) => {
            const destinoId = link.getAttribute('href');
            const destino = destinoId && destinoId.length > 1 ? document.querySelector(destinoId) : null;
            if (!destino) return;

            evento.preventDefault();
            const alturaHeader = header ? header.offsetHeight : 0;
            const posicao = destino.getBoundingClientRect().top + window.scrollY - alturaHeader - 10;

            window.scrollTo({
                top: posicao,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });

            // Atualiza a URL sem forçar um salto extra na página
            history.pushState(null, '', destinoId);
        });
    });
}

/* --------------------------------------------------------------------------
   4) Destaca o link do menu correspondente à seção visível na tela
   -------------------------------------------------------------------------- */
function initLinkAtivo() {
    const secoes = document.querySelectorAll('section[id], .hero[id]');
    const links = document.querySelectorAll('.nav-link');
    if (!secoes.length || !links.length) return;

    const linkPorId = new Map();
    links.forEach((link) => {
        const id = link.getAttribute('href').replace('#', '');
        linkPorId.set(id, link);
    });

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                const link = linkPorId.get(entrada.target.id);
                if (!link) return;
                if (entrada.isIntersecting) {
                    links.forEach((l) => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        },
        { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    secoes.forEach((secao) => observador.observe(secao));
}

/* --------------------------------------------------------------------------
   5) Revela seções e cards suavemente conforme entram na tela
   -------------------------------------------------------------------------- */
function initRevelacaoAoRolar(prefersReducedMotion) {
    const elementos = document.querySelectorAll('.reveal');
    if (!elementos.length) return;

    if (prefersReducedMotion) {
        elementos.forEach((el) => el.classList.add('visible'));
        return;
    }

    const observador = new IntersectionObserver(
        (entradas, obs) => {
            entradas.forEach((entrada, indice) => {
                if (!entrada.isIntersecting) return;
                // Pequeno escalonamento entre elementos que aparecem juntos
                const atraso = (indice % 4) * 90;
                setTimeout(() => entrada.target.classList.add('visible'), atraso);
                obs.unobserve(entrada.target);
            });
        },
        { threshold: 0.15 }
    );

    elementos.forEach((el) => observador.observe(el));

    // Seguro extra: se algo impedir a revelação normal (observer não
    // suportado, elemento fora do padrão esperado, etc.), garante que
    // o conteúdo apareça de qualquer forma depois de um tempo curto.
    setTimeout(() => {
        elementos.forEach((el) => el.classList.add('visible'));
    }, 2000);
}

/* --------------------------------------------------------------------------
   6) Contadores animados na seção "Números"
   -------------------------------------------------------------------------- */
function initContadores(prefersReducedMotion) {
    const numeros = document.querySelectorAll('.stat-num');
    if (!numeros.length) return;

    const facilitarSaida = (t) => 1 - Math.pow(1 - t, 3); // ease-out cúbico

    const animarNumero = (elemento) => {
        const alvo = parseInt(elemento.dataset.target, 10) || 0;
        const sufixo = elemento.dataset.suffix || '';

        if (prefersReducedMotion) {
            elemento.textContent = alvo + sufixo;
            return;
        }

        const duracao = 1400;
        const inicio = performance.now();

        const passo = (agora) => {
            const progresso = Math.min((agora - inicio) / duracao, 1);
            const valorAtual = Math.round(alvo * facilitarSaida(progresso));
            elemento.textContent = valorAtual + sufixo;
            if (progresso < 1) requestAnimationFrame(passo);
        };

        requestAnimationFrame(passo);
    };

    const observador = new IntersectionObserver(
        (entradas, obs) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                animarNumero(entrada.target);
                obs.unobserve(entrada.target);
            });
        },
        { threshold: 0.6 }
    );

    numeros.forEach((numero) => observador.observe(numero));
}

/* --------------------------------------------------------------------------
   7) Botão flutuante "voltar ao topo"
   -------------------------------------------------------------------------- */
function initVoltarAoTopo() {
    const botao = document.getElementById('voltarTopo');
    if (!botao) return;

    const LIMIAR = 400;

    window.addEventListener(
        'scroll',
        () => botao.classList.toggle('show', window.scrollY > LIMIAR),
        { passive: true }
    );

    botao.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
    });
}

/* --------------------------------------------------------------------------
   8) Ano do rodapé sempre atualizado
   -------------------------------------------------------------------------- */
function initAnoRodape() {
    const span = document.getElementById('anoAtual');
    if (span) span.textContent = String(new Date().getFullYear());
}

/* --------------------------------------------------------------------------
   9) Chuva de confete verde e dourado ao clicar em "Ver Troféus"
      Um único momento de celebração, orquestrado e com tempo limitado.
   -------------------------------------------------------------------------- */
function initConfeteTrofeus(prefersReducedMotion) {
    const botao = document.getElementById('btnTrofeus');
    if (!botao || prefersReducedMotion) return;

    const CORES = ['#00641e', '#00b12c', '#cb9c24', '#ffffff'];
    let animando = false;

    botao.addEventListener('click', () => {
        if (animando) return;
        animando = true;

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '2000';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const redimensionar = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        redimensionar();

        const QUANTIDADE = 90;
        const particulas = Array.from({ length: QUANTIDADE }, () => criarParticula(canvas));

        const DURACAO_MS = 2200;
        const inicio = performance.now();

        function criarParticula(alvo) {
            return {
                x: Math.random() * (alvo.width / dpr),
                y: -20 - Math.random() * 200,
                velocidadeY: 2 + Math.random() * 3,
                velocidadeX: (Math.random() - 0.5) * 2,
                tamanho: 4 + Math.random() * 6,
                cor: CORES[Math.floor(Math.random() * CORES.length)],
                rotacao: Math.random() * Math.PI,
                velocidadeRotacao: (Math.random() - 0.5) * 0.2
            };
        }

        function desenhar(agora) {
            const decorrido = agora - inicio;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particulas.forEach((p) => {
                p.x += p.velocidadeX;
                p.y += p.velocidadeY;
                p.rotacao += p.velocidadeRotacao;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotacao);
                ctx.fillStyle = p.cor;
                ctx.fillRect(-p.tamanho / 2, -p.tamanho / 4, p.tamanho, p.tamanho / 2);
                ctx.restore();
            });

            if (decorrido < DURACAO_MS) {
                requestAnimationFrame(desenhar);
            } else {
                canvas.remove();
                animando = false;
            }
        }

        requestAnimationFrame(desenhar);
        window.addEventListener('resize', redimensionar, { once: true });
    });
}