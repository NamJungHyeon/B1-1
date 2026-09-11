const GITHUB_USERNAME = 'NamJungHyeon';

const NAV_SCROLL_THRESHOLD = 60;   // 네비게이션 배경 변경 기준 (px)
const SCROLL_TOP_THRESHOLD = 300;  // 스크롤 탑 버튼 노출 기준 (px)
const REVEAL_THRESHOLD = 0.2;      // Intersection Observer threshold
const PROJECTS_PAGE_SIZE = 6;      // 더보기를 누르기 전까지 보여줄 프로젝트 개수

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mzebvewy';
const isFormspreeConfigured = !FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID');

/* =========================================
   1. 다크 모드: 상태(localStorage + 시스템 설정) -> 렌더링(data-theme)
   ========================================= */
const initTheme = () => {
    const themeIcon = document.querySelector('#theme-icon');
    const savedTheme = localStorage.getItem('theme');
    const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const initialTheme = savedTheme || (systemQuery.matches ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme, themeIcon);

    // 저장된 값이 없을 때만 시스템 설정 변경을 실시간으로 따라간다.
    // 사용자가 토글을 눌러 직접 선택하면(localStorage에 값이 생기면) 더 이상 따라가지 않는다.
    systemQuery.addEventListener('change', (event) => {
        if (localStorage.getItem('theme')) return;

        const nextTheme = event.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        updateThemeIcon(nextTheme, themeIcon);
    });
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
   3. Hero 타이핑 효과
   ========================================= */
const TYPING_SPEED_MS = 150;

const setupTypingEffect = () => {
    const target = document.querySelector('#typing-target');
    const fullText = target.textContent;

    target.textContent = '';
    target.classList.add('typing');

    let charIndex = 0;
    const typeNextChar = () => {
        charIndex += 1;
        target.textContent = fullText.slice(0, charIndex);

        if (charIndex < fullText.length) {
            setTimeout(typeNextChar, TYPING_SPEED_MS);
        } else {
            target.classList.remove('typing');
        }
    };

    setTimeout(typeNextChar, TYPING_SPEED_MS);
};

/* =========================================
   4. 스크롤 관련: 네비 배경 변경 + 스크롤탑 버튼
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
   5. 스크롤 애니메이션 (Intersection Observer)
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
   6. 폼 유효성 검사 + 전송: 입력 -> 상태 -> 에러/성공 메시지
   ========================================= */
const setupContactForm = () => {
    const form = document.querySelector('#contact-form');
    const successMsg = document.querySelector('#form-success');
    const errorMsg = document.querySelector('#form-error-msg');
    const submitBtn = form.querySelector('.contact-form__submit');

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

    const showResultMessage = (successEl, hide = 4000) => {
        successMsg.hidden = successEl !== successMsg;
        errorMsg.hidden = successEl !== errorMsg;
        successEl.hidden = false;

        if (hide) {
            setTimeout(() => {
                successEl.hidden = true;
            }, hide);
        }
    };

    const submitToFormspree = async () => {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(form),
        });

        if (!response.ok) {
            throw new Error(`Formspree 요청 실패: ${response.status}`);
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const results = Object.keys(fields).map((key) => validateField(key));
        const isValid = results.every(Boolean);

        if (!isValid) {
            successMsg.hidden = true;
            errorMsg.hidden = true;
            return;
        }

        if (!isFormspreeConfigured) {
            showResultMessage(successMsg);
            form.reset();
            Object.values(fields).forEach((field) => showFieldError(field, ''));
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '보내는 중...';

        try {
            await submitToFormspree();
            showResultMessage(successMsg);
            form.reset();
            Object.values(fields).forEach((field) => showFieldError(field, ''));
        } catch (err) {
            console.error(err);
            showResultMessage(errorMsg);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '보내기';
        }
    });
};

/* =========================================
   7. GitHub API 연동: 로딩 / 성공 / 에러 / 빈 상태 + 언어 필터
   ========================================= */
// repos와 activeLanguage는 항상 함께 바뀌고(필터 클릭 -> 둘 다 참조해서 다시 렌더링),
// 여러 함수(renderFilters/applyFilter/loadProjects)가 같이 읽고 쓰므로
// 개별 변수 대신 하나의 상태 객체로 묶어서 관리한다.
const projectsState = {
    repos: [],
    activeLanguage: 'all',
    expanded: false,
};

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

const createProjectCard = ({ name, html_url, description, stargazers_count, language, fork }) => `
    <article class="project-card">
        <h3>${name}</h3>
        <p>${description ?? '설명이 없는 프로젝트입니다.'}</p>
        <div class="project-card__meta">
            <span><i class="fa-solid fa-star"></i> ${stargazers_count}</span>
            ${language ? `<span><i class="fa-solid fa-code"></i> ${language}</span>` : ''}
            ${fork ? `<span class="badge-fork"><i class="fa-solid fa-code-fork"></i> Forked</span>` : ''}
        </div>
        <a class="project-card__link" href="${html_url}" target="_blank" rel="noopener noreferrer">
            저장소 보기 <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
    </article>
`;

const renderProjects = (grid, repos) => {
    grid.innerHTML = repos.map(createProjectCard).join('');
};

const getLanguages = (repos) => {
    const languages = repos.map((repo) => repo.language).filter(Boolean);
    return [...new Set(languages)];
};

const FORKED_FILTER_KEY = 'forked';

const renderFilters = () => {
    const filterEl = document.querySelector('#projects-filter');
    const languages = getLanguages(projectsState.repos);
    const hasForks = projectsState.repos.some((repo) => repo.fork);

    if (languages.length === 0 && !hasForks) {
        filterEl.innerHTML = '';
        return;
    }

    const filterKeys = ['all', ...languages, ...(hasForks ? [FORKED_FILTER_KEY] : [])];

    const buttons = filterKeys.map((key) => {
        const label = key === 'all' ? '전체' : key === FORKED_FILTER_KEY ? 'Forked' : key;
        const activeClass = key === projectsState.activeLanguage ? 'active' : '';
        return `<button type="button" class="filter-btn ${activeClass}" data-lang="${key}">${label}</button>`;
    });

    filterEl.innerHTML = buttons.join('');

    filterEl.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            projectsState.activeLanguage = btn.dataset.lang;
            projectsState.expanded = false;
            renderFilters();
            applyFilter();
        });
    });
};

const renderMoreButton = (filteredCount) => {
    const moreEl = document.querySelector('#projects-more');

    if (projectsState.expanded || filteredCount <= PROJECTS_PAGE_SIZE) {
        moreEl.innerHTML = '';
        return;
    }

    const hiddenCount = filteredCount - PROJECTS_PAGE_SIZE;
    moreEl.innerHTML = `
        <button type="button" class="load-more-btn" id="load-more-btn">
            더보기 (${hiddenCount}개 더)
        </button>
    `;

    document.querySelector('#load-more-btn').addEventListener('click', () => {
        projectsState.expanded = true;
        applyFilter();
    });
};

const applyFilter = () => {
    const statusEl = document.querySelector('#projects-status');
    const grid = document.querySelector('#projects-grid');

    const filtered = projectsState.activeLanguage === 'all'
        ? projectsState.repos
        : projectsState.activeLanguage === FORKED_FILTER_KEY
            ? projectsState.repos.filter((repo) => repo.fork)
            : projectsState.repos.filter((repo) => repo.language === projectsState.activeLanguage);

    if (filtered.length === 0) {
        grid.innerHTML = '';
        document.querySelector('#projects-more').innerHTML = '';
        renderEmpty(statusEl);
        return;
    }

    const visible = projectsState.expanded ? filtered : filtered.slice(0, PROJECTS_PAGE_SIZE);

    statusEl.innerHTML = '';
    renderProjects(grid, visible);
    renderMoreButton(filtered.length);
};

async function loadProjects() {
    const statusEl = document.querySelector('#projects-status');
    const grid = document.querySelector('#projects-grid');
    const filterEl = document.querySelector('#projects-filter');
    const moreEl = document.querySelector('#projects-more');

    grid.innerHTML = '';
    filterEl.innerHTML = '';
    moreEl.innerHTML = '';
    renderLoading(statusEl);

    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);

        if (!response.ok) {
            throw new Error(`GitHub API 요청 실패: ${response.status}`);
        }

        const repos = await response.json();
        projectsState.repos = repos;
        projectsState.activeLanguage = 'all';
        projectsState.expanded = false;

        if (repos.length === 0) {
            renderEmpty(statusEl);
            return;
        }

        renderFilters();
        applyFilter();
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
    setupTypingEffect();
    setupScrollEffects();
    setupScrollReveal();
    setupContactForm();
    loadProjects();
});
