function Snapzy(selector, options = {}) {
  this.container = document.querySelector(selector);
  if (!this.container)
    return console.error(`No container found with ${selector}`);

  this.originalSlides = Array.from(this.container.children);
  this.slides = [...this.originalSlides];
  if (!this.slides.length)
    return console.error('Please provide slide content for container');

  this.opts = Object.assign(
    {
      loop: true,
      items: 1, // số lượng item hiển thị/page
      autoplay: false,
      autoplayInterval: 3000,
      autoplayHoverPause: true,
      speed: 300,
      nav: true,
      controls: true,
      controlsText: ['<', '>'],
      prevButton: null,
      nextButton: null,
      slideBy: 1
    },
    options
  );

  this.currentIndex = this.opts.loop ? this._getCloneCount() : 0;
  this._init();
  this._updatePosition();
}

Snapzy.prototype._init = function () {
  this.container.className = 'snapzy-wrapper';

  this._createContent();
  this._createTrack();

  const showNav = this._getSlideCount() > this.opts.items;
  if (this.opts.controls && showNav) this._createButtonControls();
  if (this.opts.nav && showNav) this._createNav();

  if (this.opts.autoplay) {
    this._runAutoplay();

    if (this.opts.autoplayHoverPause) {
      this.container.onmouseenter = () => this._stopAutoplay();
      this.container.onmouseleave = () => this._runAutoplay();
    }
  }
};

Snapzy.prototype._runAutoplay = function () {
  if (this.autoplayTimer) return;

  const slideBy = this._getSlideBy();
  this.autoplayTimer = setInterval(() => {
    this._moveSlide(slideBy);
  }, this.opts.autoplayInterval);
};

Snapzy.prototype._stopAutoplay = function () {
  clearInterval(this.autoplayTimer);
  this.autoplayTimer = null;
};

Snapzy.prototype._createContent = function () {
  this.content = document.createElement('div');
  this.content.className = 'snapzy-content';
  this.container.append(this.content);
};

Snapzy.prototype._createTrack = function () {
  this.track = document.createElement('div');
  this.track.classList.add('snapzy-track');

  if (this.opts.loop) {
    const cloneHead = this.originalSlides
      .slice(-this._getCloneCount())
      .map((node) => node.cloneNode(true));
    const cloneTail = this.originalSlides
      .slice(0, this._getCloneCount())
      .map((node) => node.cloneNode(true));

    this.slides = [...cloneHead, ...this.slides, ...cloneTail];
  }

  this.slides.forEach((slide) => {
    slide.classList.add('snapzy-slide');
    slide.style.flexBasis = `calc(100% / ${this.opts.items})`;
    this.track.append(slide);
  });

  this.content.append(this.track);
};

Snapzy.prototype._getCloneCount = function () {
  // Lấy tổng số slide gốc
  const slideCount = this._getSlideCount();
  // Nếu số slide ít hơn hoặc bằng số lượng slide hiển thị cùng lúc, không cần clone gì cả
  if (slideCount <= this.opts.items) return 0;
  const slideBy = this._getSlideBy();

  const cloneCount = slideBy + this.opts.items;
  return cloneCount > slideCount ? slideCount : cloneCount;
};

Snapzy.prototype._getSlideBy = function () {
  return this.opts.slideBy === 'page' ? this.opts.items : this.opts.slideBy;
};

Snapzy.prototype._createButtonControls = function () {
  const { controlsText, prevButton, nextButton } = this.opts;
  this.prevButton = prevButton
    ? document.querySelector(prevButton)
    : document.createElement('button');
  this.nextButton = nextButton
    ? document.querySelector(nextButton)
    : document.createElement('button');

  if (!prevButton) {
    this.prevButton.className = 'snapzy-pre';
    this.prevButton.innerText = controlsText[0];
    this.content.append(this.prevButton);
  }

  if (!nextButton) {
    this.nextButton.className = 'snapzy-next';
    this.nextButton.innerText = controlsText[1];
    this.content.append(this.nextButton);
  }

  const slideBy = this._getSlideBy();

  this.prevButton.onclick = () => this._moveSlide(-slideBy);
  this.nextButton.onclick = () => this._moveSlide(slideBy);
};

Snapzy.prototype._getSlideCount = function () {
  return this.originalSlides.length;
};

Snapzy.prototype._createNav = function () {
  this.navWrapper = document.createElement('div');
  this.navWrapper.className = 'snapzy-nav';

  const slideCount = this._getSlideCount();

  const pageCount = Math.ceil(slideCount / this.opts.items);

  for (let i = 0; i < pageCount; i++) {
    const dot = document.createElement('button');
    dot.className = 'snapzy-dot';
    dot.onclick = () => {
      this.currentIndex = this.opts.loop
        ? i * this.opts.items + this._getCloneCount()
        : i * this.opts.items;
      this._updatePosition();
    };

    if (i === 0) dot.classList.add('active');

    this.navWrapper.append(dot);
  }
  this.container.append(this.navWrapper);
};

// 2 3 4 5 6(clone) [1 2 3 4 5 6] 1  2  3  4  5(clone)
// 0 1 2 3 4         5 6 7 8 9 10 11 12 12 14 15

// 3 4 5(clone) [1 2 3 4 5] 1 2 3(clone)
// 0 1 2         3 4 5 6 7  8 9 10
// Tính toán index slide hiện tại
Snapzy.prototype._moveSlide = function (step) {
  if (this._isAnimating) return;
  this._isAnimating = true;

  const maxIndex = this.slides.length - this.opts.items;
  this.currentIndex = Math.min(Math.max(this.currentIndex + step, 0), maxIndex);
  console.log(this.currentIndex);
  const slideCount = this._getSlideCount();

  setTimeout(() => {
    if (this.opts.loop) {
      if (this.currentIndex < this._getCloneCount()) {
        this.currentIndex += slideCount;
        console.log(this.currentIndex);
        this._updatePosition(true);
      } else if (this.currentIndex > slideCount) {
        this.currentIndex -= slideCount;

        this._updatePosition(true);
      }
    }
    this._isAnimating = false;
  }, this.opts.speed);

  this._updatePosition();
};

// Tính toán kích thước 1 item và dịch chuyển this.track
Snapzy.prototype._updatePosition = function (instant = false) {
  this.track.style.transition = instant
    ? 'none'
    : `transform ${this.opts.speed}ms`;
  this.offset = -(this.currentIndex * (100 / this.opts.items));
  this.track.style.transform = `translateX(${this.offset}%)`;

  if (this.opts.nav && !instant) {
    this._updateNav();
  }
};

Snapzy.prototype._updateNav = function () {
  if (!this.navWrapper) return;

  const { items, loop } = this.opts;

  let realIndex = this.currentIndex;
  const slideCount = this._getSlideCount();
  if (loop)
    realIndex =
      (this.currentIndex - this._getCloneCount() + slideCount) % slideCount;

  const pageIndex = Math.floor(realIndex / items);

  Array.from(this.navWrapper.children).forEach((btn, index) => {
    btn.classList.toggle('active', index === pageIndex);
  });
};

// a % n luôn cho kết quả trong khoảng [0, n - 1], nếu n > 0
/*
  realIndex = (this.currentIndex - items + slideCount) % slideCount;
  this.currentIndex - items: trừ đi số lượng slide clone ở đầu → xác định vị trí tương đối trong danh sách gốc.
  + slideCount: đảm bảo giá trị không âm (nếu this.currentIndex < items, kết quả có thể âm → cộng để đưa về dương).
  % slideCount: dùng chia lấy dư để wrap lại trong khoảng [0, slideCount - 1], đảm bảo realIndex luôn nằm trong vùng index hợp lệ của danh sách thật.
 *  */
