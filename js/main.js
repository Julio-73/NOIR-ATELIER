(function() {
    'use strict';

    // ===== HTML & THEME INITIALIZATION =====
    var htmlEl = document.documentElement;
    var savedTheme = null;
    try {
        savedTheme = localStorage.getItem('noir-theme');
    } catch (e) {
        console.warn('localStorage is not accessible:', e);
    }

    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        htmlEl.setAttribute('data-theme', 'light');
        try {
            localStorage.setItem('noir-theme', 'light');
        } catch (e) {}
    }

    // ===== PRELOADER with real loading bar =====
    var preloader = document.getElementById('preloader');
    var preloaderFill = document.getElementById('preloader-fill');
    var preloaderDone = false;
    var loadProgress = 0;
    var loadInterval = setInterval(function() {
        loadProgress += Math.random() * 15 + 5;
        if (loadProgress > 95) loadProgress = 95;
        if (preloaderFill) preloaderFill.style.width = loadProgress + '%';
    }, 200);
    function hidePreloader() {
        if (preloaderDone) return;
        preloaderDone = true;
        clearInterval(loadInterval);
        if (preloaderFill) preloaderFill.style.width = '100%';
        setTimeout(function() {
            if (preloader) preloader.classList.add('done');
        }, 400);
    }
    window.addEventListener('load', function() { setTimeout(hidePreloader, 600); });
    setTimeout(hidePreloader, 5000); // fallback

    // ===== CUSTOM CURSOR (NO magnetic displacement) =====
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (dot && ring && !window.matchMedia('(pointer: coarse)').matches) {
        var mx = 0, my = 0, rx = 0, ry = 0;
        document.addEventListener('mousemove', function(e) {
            mx = e.clientX;
            my = e.clientY;
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
        });
        function cursorRaf() {
            rx += (mx - rx) * 0.15;
            ry += (my - ry) * 0.15;
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            requestAnimationFrame(cursorRaf);
        }
        requestAnimationFrame(cursorRaf);
        document.addEventListener('mousedown', function() { ring.classList.add('click'); });
        document.addEventListener('mouseup', function() { ring.classList.remove('click'); });

        var hoverSelector = 'a, button, .collection-item, .lookbook-item, .editorial-img';
        document.querySelectorAll(hoverSelector).forEach(function(el) {
            el.addEventListener('mouseenter', function() { ring.classList.add('hover'); });
            el.addEventListener('mouseleave', function() { ring.classList.remove('hover'); });
        });
    }

    // ===== PARALLAX =====
    var parallaxEls = document.querySelectorAll('[data-parallax]');
    if (parallaxEls.length) {
        function parallaxRaf() {
            var scrollY = window.scrollY || window.pageYOffset;
            parallaxEls.forEach(function(el) {
                var speed = parseFloat(el.dataset.parallax) || 0.2;
                var rect = el.getBoundingClientRect();
                var elCenter = rect.top + rect.height / 2;
                var winCenter = window.innerHeight / 2;
                var offset = (elCenter - winCenter) * speed;
                el.style.transform = 'translateY(' + offset + 'px)';
            });
            requestAnimationFrame(parallaxRaf);
        }
        requestAnimationFrame(parallaxRaf);
    }

    // ===== MOBILE MENU =====
    var menuToggle = document.querySelector('.menu-toggle');
    var mobileMenu = document.querySelector('.mobile-menu');
    var mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    var body = document.body;

    function openMenu() {
        menuToggle.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        body.classList.add('menu-open');
    }
    function closeMenu() {
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        body.classList.remove('menu-open');
    }
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.contains('active') ? closeMenu() : openMenu();
        });
    }
    mobileNavLinks.forEach(function(link) {
        link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) closeMenu();
    });

    // ===== INTERSECTION OBSERVER =====
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { root: null, rootMargin: '0px 0px -100px 0px', threshold: 0.1 });

    document.querySelectorAll('.fade-in, .fade-scale, .fade-left, .fade-right').forEach(function(el) {
        observer.observe(el);
    });

    // ===== NAV SCROLL (respeta tema light) =====
    var nav = document.querySelector('nav');
    var isLight = htmlEl.getAttribute('data-theme') === 'light';
    function updateNavBg() {
        var y = window.scrollY || window.pageYOffset;
        var isLightNow = htmlEl.getAttribute('data-theme') === 'light';
        if (y > 100) {
            nav.style.background = isLightNow ? 'rgba(245,245,240,0.95)' : 'rgba(10,10,10,0.95)';
            nav.style.padding = '1.2rem 4vw';
        } else {
            nav.style.background = isLightNow ? 'rgba(245,245,240,0.8)' : 'rgba(10,10,10,0.8)';
            nav.style.padding = '2rem 4vw';
        }
    }
    window.addEventListener('scroll', updateNavBg, { passive: true });
    updateNavBg();

    // ===== NEWSLETTER =====
    var newsletterForm = document.getElementById('newsletter-form');
    var newsletterSuccess = document.getElementById('newsletter-success');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            newsletterForm.classList.add('hidden');
            if (newsletterSuccess) newsletterSuccess.classList.add('show');
        });
    }

    // ===== PWA SERVICE WORKER =====
    if ('serviceWorker' in navigator) {
        var swCode = 'self.addEventListener("install",function(e){e.waitUntil(self.skipWaiting())});self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});self.addEventListener("fetch",function(e){e.respondWith(fetch(e.request).catch(function(){return new Response("Offline",{status:503})}))});';
        var swBlob = new Blob([swCode], { type: 'application/javascript' });
        var swUrl = URL.createObjectURL(swBlob);
        navigator.serviceWorker.register(swUrl).catch(function() {});
    }

    // ===== SCROLL PROGRESS BAR =====
    var scrollProgressBar = document.getElementById('scroll-progress-bar');
    function updateScrollProgress() {
        var scrollTop = window.scrollY || window.pageYOffset;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (scrollProgressBar) scrollProgressBar.style.width = progress + '%';
    }
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // ===== 3D TILT ON COLLECTION CARDS =====
    document.querySelectorAll('.collection-item').forEach(function(card) {
        var img = card.querySelector('img');
        if (!img) return;
        var parent = img.parentNode;
        var overlay = parent.querySelector('.collection-overlay') || card.querySelector('.collection-overlay');
        var wrapper = document.createElement('div');
        wrapper.className = 'tilt-inner';
        parent.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        if (overlay) wrapper.appendChild(overlay);
        card.addEventListener('mousemove', function(e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var cx = rect.width / 2;
            var cy = rect.height / 2;
            var rx = (y - cy) / cy * -8;
            var ry = (x - cx) / cx * 8;
            wrapper.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale3d(1.02, 1.02, 1.02)';
        });
        card.addEventListener('mouseleave', function() {
            wrapper.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // ===== THEME TOGGLE =====
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', newTheme);
            try {
                localStorage.setItem('noir-theme', newTheme);
            } catch (e) {}
            updateNavBg();
            console.log('Theme changed to:', newTheme);
        });
    }

    // ===== MOBILE THEME TOGGLE =====
    var mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', function() {
            var newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', newTheme);
            try {
                localStorage.setItem('noir-theme', newTheme);
            } catch (e) {}
            updateNavBg();
        });
    }

    // ===== STICKY PRODUCT SIDEBAR =====
    var productSidebar = document.getElementById('product-sidebar');
    if (productSidebar) {
        function toggleSidebar() {
            var y = window.scrollY || window.pageYOffset;
            var hero = document.querySelector('.hero');
            var heroHeight = hero ? hero.offsetHeight : window.innerHeight;
            if (y > heroHeight * 0.6) {
                productSidebar.classList.add('visible');
            } else {
                productSidebar.classList.remove('visible');
            }
        }
        window.addEventListener('scroll', toggleSidebar, { passive: true });
        toggleSidebar();
    }

    // ===== CART FUNCTIONALITY =====
    var cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('noir-cart')) || [];
    } catch (e) {
        console.warn('Could not load cart from localStorage:', e);
    }
    var cartBtn = document.getElementById('cart-btn');
    var cartPanel = document.getElementById('cart-panel');
    var cartPanelClose = document.getElementById('cart-panel-close');
    var cartPanelItems = document.getElementById('cart-panel-items');
    var cartPanelTotal = document.getElementById('cart-panel-total');
    var cartCount = document.getElementById('cart-count');

    function saveCart() {
        try {
            localStorage.setItem('noir-cart', JSON.stringify(cart));
        } catch (e) {}
    }
    function updateCartCount() {
        if (cartCount) {
            var totalItems = cart.reduce(function(sum, item) { return sum + (item.qty || 1); }, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    function updateCartPanel() {
        if (!cartPanelItems) return;
        if (cart.length === 0) {
            cartPanelItems.innerHTML = '<p class="cart-panel-empty">Tu bolsa está vacía</p>';
        } else {
            cartPanelItems.innerHTML = cart.map(function(item, index) {
                return '<div class="cart-panel-item">' +
                    '<img src="' + item.img + '" alt="' + item.name + '">' +
                    '<div class="cart-panel-item-info">' +
                    '<h4>' + item.name + '</h4>' +
                    '<p>€' + item.price + ' x ' + (item.qty || 1) + '</p>' +
                    '</div>' +
                    '<button class="cart-panel-item-remove" data-index="' + index + '">✕</button>' +
                    '</div>';
            }).join('');
            document.querySelectorAll('.cart-panel-item-remove').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    cart.splice(parseInt(this.dataset.index), 1);
                    saveCart();
                    updateCartPanel();
                    updateCartCount();
                });
            });
        }
        var total = cart.reduce(function(sum, item) { return sum + (item.price * (item.qty || 1)); }, 0);
        if (cartPanelTotal) cartPanelTotal.textContent = '€' + total;
    }
    function addToCart(name, price, img) {
        var existing = cart.find(function(item) { return item.name === name; });
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            cart.push({ name: name, price: price, img: img, qty: 1 });
        }
        saveCart();
        updateCartCount();
        updateCartPanel();
    }
    function openCartPanel() {
        if (cartPanel) cartPanel.classList.add('active');
        body.classList.add('menu-open');
    }
    function closeCartPanel() {
        if (cartPanel) cartPanel.classList.remove('active');
        body.classList.remove('menu-open');
    }
    if (cartBtn) cartBtn.addEventListener('click', openCartPanel);
    if (cartPanelClose) cartPanelClose.addEventListener('click', closeCartPanel);
    if (cartPanel) {
        cartPanel.querySelector('.cart-panel-bg').addEventListener('click', closeCartPanel);
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && cartPanel && cartPanel.classList.contains('active')) closeCartPanel();
    });

    // Add to cart buttons
    document.querySelectorAll('.product-sidebar-btn, .product-add-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var name = this.dataset.name || 'Producto';
            var price = parseInt(this.dataset.price) || 0;
            var img = this.dataset.img || '';
            addToCart(name, price, img);
            this.textContent = 'Añadido ✓';
            this.style.backgroundColor = 'var(--accent)';
            this.style.color = 'var(--text-primary)';
            setTimeout(function() {
                btn.textContent = btn.classList.contains('product-add-btn') ? 'Añadir a la bolsa — €' + price : 'Añadir a la bolsa';
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 2000);
        });
    });

    updateCartCount();
    updateCartPanel();

    // ===== PRODUCT PAGE — SELECTORS =====
    document.querySelectorAll('.product-selector-options').forEach(function(group) {
        var options = group.querySelectorAll('.product-selector-option');
        options.forEach(function(opt) {
            opt.addEventListener('click', function() {
                options.forEach(function(o) { o.classList.remove('active'); });
                this.classList.add('active');
            });
        });
    });

    // ===== PRODUCT PAGE — GALLERY THUMBS =====
    var mainImg = document.getElementById('product-main-img');
    var thumbs = document.querySelectorAll('.product-thumb');
    if (mainImg && thumbs.length) {
        thumbs.forEach(function(thumb) {
            thumb.addEventListener('click', function() {
                thumbs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                mainImg.src = this.dataset.src;
            });
        });
    }

    // ===== HORIZONTAL SCROLL — Mouse Wheel =====
    var hScroll = document.getElementById('horizontal-scroll');
    if (hScroll) {
        hScroll.addEventListener('wheel', function(e) {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                hScroll.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    // ===== COUNTDOWN TIMER =====
    var countdownDays = document.getElementById('countdown-days');
    var countdownHours = document.getElementById('countdown-hours');
    var countdownMinutes = document.getElementById('countdown-minutes');
    var countdownSeconds = document.getElementById('countdown-seconds');
    if (countdownDays && countdownHours && countdownMinutes && countdownSeconds) {
        var endDate = new Date();
        endDate.setDate(endDate.getDate() + 2);
        endDate.setHours(endDate.getHours() + 14);
        endDate.setMinutes(endDate.getMinutes() + 35);
        function updateCountdown() {
            var now = new Date();
            var diff = endDate - now;
            if (diff <= 0) diff = 0;
            var days = Math.floor(diff / (1000 * 60 * 60 * 24));
            var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((diff % (1000 * 60)) / 1000);
            countdownDays.textContent = String(days).padStart(2, '0');
            countdownHours.textContent = String(hours).padStart(2, '0');
            countdownMinutes.textContent = String(minutes).padStart(2, '0');
            countdownSeconds.textContent = String(seconds).padStart(2, '0');
        }
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

})();