// TODO: 본인의 GitHub 아이디로 교체하세요.
const GITHUB_USERNAME = 'octocat';

const NAV_SCROLL_THRESHOLD = 60;   // 네비게이션 배경 변경 기준 (px)
const SCROLL_TOP_THRESHOLD = 300;  // 스크롤 탑 버튼 노출 기준 (px)
const REVEAL_THRESHOLD = 0.2;      // Intersection Observer threshold

/* =========================================
   1. 다크 모드: 상태(localStorage) -> 렌더링(data-theme)
   ========================================= */
const initTheme = () => {
    const themeIcon = document.querySelector('#theme-icon');
    const savedTheme = localStorage.getItem('theme') || 'light';

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, themeIcon);
};

const updateThemeIcon = (theme, iconEl) => {
    if (!iconEl) return;
    iconEl.classList.toggle('fa-moon', theme === 'light');
    iconEl.classList.toggle('fa-sun', theme === 'dark');
};

const setupThemeToggle = () => {
    const toggleBtn = document.querySelector('#theme-toggle');
    const themeIcon = document.querySelector('#theme-icon');

    toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next, themeIcon);
    });
};

/* =========================================
   2. 햄버거 메뉴 토글
   ========================================= */
const setupHamburgerMenu = () => {
    const hamburger = document.querySelector('#hamburger');
    const navMenu = document.querySelector('#nav-menu');

    hamburger.addEventListener('click', () => {
        const isActive = navMenu.classList.toggle('active');
        hamburger.classList.toggle('active', isActive);
        hamburger.setAttribute('aria-expanded', String(isActive));
    });

    navMenu.querySelectorAll('.nav__link').forEach((link) => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
};

/* =========================================
   3. 스크롤 관련: 네비 배경 변경 + 스크롤탑 버튼
   ========================================= */
const setupScrollEffects = () => {
    const header = document.querySelector('#header');
    const scrollTopBtn = document.querySelector('#scroll-top');

    const handleScroll = () => {
        const { scrollY } = window;

        header.classList.toggle('scrolled', scrollY > NAV_SCROLL_THRESHOLD);
        scrollTopBtn.classList.toggle('visible', scrollY > SCROLL_TOP_THRESHOLD);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

/* =========================================
   4. 스크롤 애니메이션 (Intersection Observer)
   ========================================= */
const setupScrollReveal = () => {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: REVEAL_THRESHOLD }
    );

    revealEls.forEach((el) => observer.observe(el));
};

/* =========================================
   5. 폼 유효성 검사: 입력 -> 상태 -> 에러 메시지
   ========================================= */
const setupContactForm = () => {
    const form = document.querySelector('#contact-form');
    const successMsg = document.querySelector('#form-success');

    const fields = {
        name: {
            input: document.querySelector('#name'),
            error: document.querySelector('#name-error'),
            validate: (value) => (value.trim().length === 0 ? '이름을 입력해주세요.' : ''),
        },
        email: {
            input: document.querySelector('#email'),
            error: document.querySelector('#email-error'),
            validate: (value) => {
                if (value.trim().length === 0) return '이메일을 입력해주세요.';
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailPattern.test(value) ? '' : '올바른 이메일 형식이 아닙니다.';
            },
        },
        message: {
            input: document.querySelector('#message'),
            error: document.querySelector('#message-error'),
            validate: (value) => (value.trim().length === 0 ? '메시지를 입력해주세요.' : ''),
        },
    };

    const showFieldError = (field, message) => {
        const { input, error } = field;
        error.textContent = message;
        input.closest('.form-group').classList.toggle('has-error', Boolean(message));
    };

    const validateField = (key) => {
        const field = fields[key];
        const message = field.validate(field.input.value);
        showFieldError(field, message);
        return message === '';
    };

    Object.keys(fields).forEach((key) => {
        fields[key].input.addEventListener('input', () => validateField(key));
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const results = Object.keys(fields).map((key) => validateField(key));
        const isValid = results.every(Boolean);

        if (!isValid) {
            successMsg.hidden = true;
            return;
        }

        successMsg.hidden = false;
        form.reset();
        Object.values(fields).forEach((field) => showFieldError(field, ''));

        setTimeout(() => {
            successMsg.hidden = true;
        }, 4000);
    });
};

/* =========================================
   6. GitHub API 연동: 로딩 / 성공 / 에러 / 빈 상태
   ========================================= */
const renderLoading = (statusEl) => {
    statusEl.innerHTML = `
        <div class="spinner"></div>
        <p>프로젝트를 불러오는 중...</p>
    `;
};

const renderError = (statusEl) => {
    statusEl.innerHTML = `
        <p>프로젝트를 불러올 수 없습니다.</p>
        <button type="button" class="retry-btn" id="retry-btn">다시 시도</button>
    `;
    document.querySelector('#retry-btn').addEventListener('click', loadProjects);
};

const renderEmpty = (statusEl) => {
    statusEl.innerHTML = `<p>표시할 프로젝트가 없습니다.</p>`;
};

const createProjectCard = ({ name, html_url, description, stargazers_count, language }) => `
    <article class="project-card">
        <h3>${name}</h3>
        <p>${description ?? '설명이 없는 프로젝트입니다.'}</p>
        <div class="project-card__meta">
            <span><i class="fa-solid fa-star"></i> ${stargazers_count}</span>
            ${language ? `<span><i class="fa-solid fa-code"></i> ${language}</span>` : ''}
        </div>
        <a class="project-card__link" href="${html_url}" target="_blank" rel="noopener noreferrer">
            저장소 보기 <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
    </article>
`;

const renderProjects = (grid, repos) => {
    grid.innerHTML = repos.map(createProjectCard).join('');
};

async function loadProjects() {
    const statusEl = document.querySelector('#projects-status');
    const grid = document.querySelector('#projects-grid');

    grid.innerHTML = '';
    renderLoading(statusEl);

    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`);

        if (!response.ok) {
            throw new Error(`GitHub API 요청 실패: ${response.status}`);
        }

        const repos = await response.json();

        if (repos.length === 0) {
            renderEmpty(statusEl);
            return;
        }

        statusEl.innerHTML = '';
        renderProjects(grid, repos);
    } catch (err) {
        console.error(err);
        renderError(statusEl);
    }
}

/* =========================================
   초기화
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    setupHamburgerMenu();
    setupScrollEffects();
    setupScrollReveal();
    setupContactForm();
    loadProjects();
});
