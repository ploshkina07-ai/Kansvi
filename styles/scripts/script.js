 window.addEventListener('scroll', function () {
            const menu = document.querySelector('.main-nav');
            if (window.scrollY > 0) {
                menu.classList.add('scrolled');
            } else {
                menu.classList.remove('scrolled');
            }
        });