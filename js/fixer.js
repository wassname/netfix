const LOAD_WAIT_MS = 2000;
var SHAKTI_BUILD = "";
var LANG = "";

$(function () {
  // wait for content to load
  setTimeout(() => {
    main();
  }, LOAD_WAIT_MS);
});

function getVideoId(el) {
  // try to get ptrack-content
  let eltc = $(el).find('.ptrack-content');
  if (eltc) {
    if (eltc.length == 0) {
      // search for track content in parents
      eltc = $(el).parents('.slider-item').find('.ptrack-content');
    }

    let tc = eltc.attr('data-ui-tracking-context');
    if (tc) {
      // parse track content json
      let json = JSON.parse(unescape(tc));
      // add video id to array
      let id = json.videoId || json.video_id;
      return parseInt(json.video_id);
    }
  }

  // try to get title card
  eltc = $(el).find('.smallTitleCard');
  if (eltc) {
    if (eltc.length == 0) {
      // search for title card in parents
      eltc = $(el).parents('.slider-item').find('.smallTitleCard');
    }

    let tc = eltc.attr('href');
    let id = tc.match(/(?:\/watch\/)(\d+)(?:\?)/)[1];

    return parseInt(id);
  }

  return null;
}

function rateVisibleItems(el) {
  let base = $('.slider-item').add(el);

  base.filter((index, el) => {
    return $(el).attr('class').match(/slider-item-\d+/);
  }).each((index, el) => {
    rateSingleItem(el, '.ptrack-content');
  });
}

function rateSingleItem(el, insert_selector, check_visibility=true, rating_class='', priority=false) {
  shouldRender = !check_visibility || $(el).visible(true);

  if (shouldRender) {
    let id = getVideoId(el);

    card = CardFactory.new(id, (card) => {
      if (card) {
        card.getDetails((rating, url) => {
          if (!isNaN(rating)) {
            // select parent to insert rating
            parent = $(el).find(insert_selector);
            // check if div was already inserted
            if ($(parent).find('.nf').length > 0) return;
            // insert div
            $(el).find(insert_selector).append(
              `
              <div class="nf ${rating_class}">
                <a href="${url}">
                <div class="ratings">
                  <div class="empty-stars"></div>
                  <div class="full-stars" style="width:${rating*10}%"></div>
                  <div class='ratings-text'>${Math.round(rating * 10) / 10}</div>
                </div>
                </a>
              </div>
              `
            );
            // $(el).find('.nf').animate({ opacity: 1 }, 500);
          }
        }, priority);
      } else {
        console.warn(`ID '${id}' not found in Netflix DB!`);
      }
    });
  }
}

const debouncedRateAll = _.partial(_.debounce(rateVisibleItems, 1000), $('.mainView'));

function addSliderObservers() {
  $('.sliderContent')
    .observe('added', '.slider-item', function(record) {
      // Observe if elements matching '.sliderContent .slider-item' have been added
      rateSingleItem(this, '.ptrack-content');
    })
    .observe('added', '.slider-item .bob-card', function(record) {
      rateSingleItem(this, '.bob-overlay', false, 'nf-rating-big', true);
    });
}

var href = window.location.href;
function checkWindowHrefChange() {
  if (window.location.href != href) {
    debouncedRateAll();
    href = window.location.href;
    // setTimeout(addSliderObservers, 500);
  }
}

function main() {
  SHAKTI_BUILD = $('script:contains("BUILD_IDENTIFIER")').text().match(/(?:"BUILD_IDENTIFIER":")(.*?)(?:")/)[1];
  LANG = $('#appMountPoint > div').attr('lang');

  // console.clear();

  rateVisibleItems($('.mainView'));

  // Event listeners
  addSliderObservers();
  $(window).resize(debouncedRateAll);
  $(window).scroll(debouncedRateAll);
  setInterval(checkWindowHrefChange, 2000);
  $('.mainView').observe('added', '.sliderContent', addSliderObservers)

}
