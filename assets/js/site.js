const FORM_ENDPOINT = '';

(function () {
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('menu');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  var top = document.getElementById('toTop');
  if (top) {
    top.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var form = document.getElementById('contactForm');
  if (!form) return;
  var msg = document.getElementById('formMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var text = form.elements.message.value.trim();
    if (!name || !email || !text || email.indexOf('@') < 1) {
      msg.textContent = '请填写姓名、邮箱和留言。';
      return;
    }
    if (!FORM_ENDPOINT) {
      msg.textContent = '联系表单正在接入中，请稍后再试。';
      return;
    }
    var submit = form.querySelector('button[type=submit]');
    submit.disabled = true;
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.reset();
      msg.textContent = '已收到您的留言，我们会尽快回复。';
    }).catch(function (err) {
      console.error('form submit failed', err);
      msg.textContent = '提交失败，请稍后再试。';
    }).then(function () {
      submit.disabled = false;
    });
  });
})();
