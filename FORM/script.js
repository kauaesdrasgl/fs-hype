(() => {
  'use strict';
  const form = document.getElementById('productForm');
  const feedback = document.getElementById('feedback');
  const saveStatus = document.getElementById('saveStatus');
  const submitButton = document.getElementById('submitButton');
  const dialog = document.getElementById('clearDialog');
  const draftKey = 'fs-hype-product-form-v1';
  const fields = [...form.querySelectorAll('input[name]:not([type="hidden"]), select[name], textarea[name]')];
  const getData = () => Object.fromEntries(fields.map(field => [field.name, field.value]));
  const setFeedback = (message, error = false) => {
    feedback.textContent = message;
    feedback.classList.toggle('error', error);
  };
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || '{}');
    fields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(saved, field.name)) field.value = saved[field.name];
    });
    if (Object.keys(saved).length) saveStatus.textContent = 'Rascunho recuperado neste dispositivo';
  } catch { saveStatus.textContent = 'Salvamento local indisponível'; }
  const save = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(getData()));
      saveStatus.textContent = 'Rascunho salvo neste dispositivo';
    } catch { saveStatus.textContent = 'Não foi possível salvar o rascunho'; }
  };
  form.addEventListener('input', save);
  form.addEventListener('change', save);
  document.getElementById('clearButton').addEventListener('click', () => dialog.showModal());
  document.getElementById('cancelClear').addEventListener('click', () => dialog.close());
  document.getElementById('confirmClear').addEventListener('click', () => {
    form.reset();
    try { localStorage.removeItem(draftKey); } catch {}
    saveStatus.textContent = 'Aguardando preenchimento';
    setFeedback('Formulário limpo. Os campos com * são obrigatórios.');
    dialog.close();
    form.querySelector('[name="Produto"]').focus();
  });
  form.addEventListener('submit', event => {
    const price = Number(document.getElementById('price').value);
    const sale = document.getElementById('salePrice').value;
    if (sale && Number(sale) >= price) {
      event.preventDefault();
      setFeedback('O preço promocional deve ser menor que o preço de venda.', true);
      document.getElementById('salePrice').focus();
      return;
    }
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }
    // O navegador envia o POST nativo ao Sheet Monkey. A confirmação real
    // depende da resposta do serviço; não presumimos que houve sucesso.
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';
    setFeedback('Enviando ao Sheet Monkey. Aguarde a confirmação do serviço.');
    setTimeout(() => { submitButton.disabled = false; submitButton.innerHTML = 'Enviar produto <span aria-hidden="true">↗</span>'; }, 10000);
  });
})();
